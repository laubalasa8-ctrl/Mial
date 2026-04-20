import normalizeInput from '../normalization/normalizeInput.js';
import runAreaEngine from '../area/areaEngine.js';
import computeSubstrateRisk from '../risk/substrateRisk.js';
import computeBase from '../modules/base.module.js';
import computeDemolition from '../modules/demolition.module.js';
import computeSubStructure from '../modules/subStructure.module.js';
import computeScaffold from '../modules/scaffold.module.js';
import computeMargin from '../modules/margin.module.js';
import computeConfidence from '../confidence/confidenceEngine.js';
import resolveOutputMode from '../rules/caps.js';
import buildPresentedResult from '../output/buildPresentedResult.js';
import { createCalculatedResult, createSalesGuidanceResult } from '../contracts/outputSchema.js';
import { resolvePostalZone } from '../config/zones.config.js';
import {
  MODULE_ID,
  ADDON_ANSWER,
  LEAD_TIMELINE,
  OWNERSHIP_STATUS,
  EXISTING_MATERIAL,
  FLOORS,
  ROOF_AGE_BAND,
  SUBSTRATE_RISK,
  ROOF_TYPE,
  AREA_METHOD,
  SYMPTOM,
  OUTPUT_MODE,
  SCAFFOLD_ASSUMPTION,
} from '../contracts/enums.js';
import pricingConfig from '../config/pricing.config.js';
import rulesConfig from '../config/rules.config.js';

/**
 * Main pipeline entry point.
 *
 * Flow:
 *   1. Normalize input
 *   2. Resolve postal zone
 *   3. Run area engine
 *   4. Compute substrate risk
 *   5. Run price modules
 *   6. Compute margin + floor protection
 *   7. Compute confidence
 *   8. Resolve output mode (caps)
 *   9. Build calculated_result
 *  10. Build presented_result
 *  11. Build sales_guidance_result
 *  12. Return all three layers
 *
 * @param {object} rawInput - Raw user input
 * @returns {{ calculated_result, presented_result, sales_guidance_result }}
 */
export default function runOfferEngine(rawInput) {
  // ── 1. NORMALIZE ──
  const { normalized, confidence_flags, warnings } = normalizeInput(rawInput);

  // ── 2. POSTAL ZONE ──
  const postal_zone = resolvePostalZone(normalized.postal_code);

  // ── 3. AREA ENGINE ──
  const areaResult = runAreaEngine({
    area_raw_input: normalized.area_raw_input,
    roof_type: normalized.roof_type,
  });

  normalized.area_m2 = areaResult.area_m2;
  normalized.area_method = areaResult.area_method;
  warnings.push(...areaResult.warnings);

  // ── AREA BLOCKER (post-area-engine validation) ──
  if (!areaResult.area_m2 || areaResult.area_m2 <= 0) {
    throw new Error(
      'Hard blocker: area_m2 could not be resolved by area engine. Engine cannot produce a price.'
    );
  }

  // ── 4. SUBSTRATE RISK ──
  const riskResult = computeSubstrateRisk(
    normalized.roof_age_band,
    normalized.symptom_flags,
  );

  // ── 5. PRICE MODULES ──
  const modules = {};

  // Base (material + work + underlayer + complexity + logistics)
  modules[MODULE_ID.M_BASE] = computeBase({
    area_m2: areaResult.area_m2,
    desired_material: normalized.desired_material,
    roof_type: normalized.roof_type,
    postal_zone,
  });

  // Demolition
  modules[MODULE_ID.M_DEMO] = computeDemolition({
    area_m2: areaResult.area_m2,
    existing_material: normalized.existing_material,
  });

  // Sub structure (risk-driven)
  modules[MODULE_ID.M_SUB_STRUCTURE] = computeSubStructure({
    area_m2: areaResult.area_m2,
    substrate_risk: riskResult.final_risk,
  });

  // Default gutter LPM (used by scaffold and gutter addon)
  const gutterFormFactor =
    rulesConfig.gutter_lpm_form_factor[normalized.roof_type] || 2.0;
  const footprintSide = Math.sqrt(areaResult.area_m2 / (areaResult.slope_factor || 1.2));
  const defaultGutterLpm = Math.round(footprintSide * gutterFormFactor * 10) / 10;

  // Scaffold
  modules[MODULE_ID.M_SCAFFOLD] = computeScaffold({
    floors: normalized.floors,
    property_access: normalized.property_access,
    default_gutter_lpm: defaultGutterLpm,
  });

  // Addon: Gutters — LPM-based, estimated from footprint (±15% spread)
  modules[MODULE_ID.M_ADDON_GUTTERS] = computeAddonLpm(
    MODULE_ID.M_ADDON_GUTTERS,
    normalized.addon_gutters,
    defaultGutterLpm,
    pricingConfig.gutter_price_per_lpm,
    'Hängrännor',
  );

  // Addon: Chimney — count-based (supports multi-chimney)
  const chimneyAction = normalized.addon_chimney?.action || ADDON_ANSWER.UNKNOWN;
  const chimneyCount = normalized.addon_chimney?.count || 1;
  modules[MODULE_ID.M_ADDON_CHIMNEY] = computeAddonFixed(
    MODULE_ID.M_ADDON_CHIMNEY,
    chimneyAction,
    pricingConfig.chimney_flashing_price * chimneyCount,
    `Skorstensbeslag: ${chimneyCount} st × ${pricingConfig.chimney_flashing_price} kr`,
  );

  // Addon: Roof windows — count-based, fixed price per unit
  const windowAction = normalized.addon_roof_windows?.action || ADDON_ANSWER.UNKNOWN;
  const windowCount = normalized.addon_roof_windows?.count || 1;
  modules[MODULE_ID.M_ADDON_WINDOWS] = computeAddonFixed(
    MODULE_ID.M_ADDON_WINDOWS,
    windowAction,
    pricingConfig.roof_window_replacement * windowCount,
    `Takfönster: ${windowCount} st × ${pricingConfig.roof_window_replacement} kr`,
  );

  // Addon: Snow safety — LPM-based, estimated from footprint (±15% spread)
  modules[MODULE_ID.M_ADDON_SNOW] = computeAddonLpm(
    MODULE_ID.M_ADDON_SNOW,
    normalized.addon_snow_safety,
    defaultGutterLpm,
    pricingConfig.snow_safety_per_lpm,
    'Snörasskydd',
  );

  // ── 6. SUBTOTALS (before margin) ──
  const priceModuleIds = [
    MODULE_ID.M_BASE,
    MODULE_ID.M_DEMO,
    MODULE_ID.M_SUB_STRUCTURE,
    MODULE_ID.M_SCAFFOLD,
    MODULE_ID.M_ADDON_GUTTERS,
    MODULE_ID.M_ADDON_CHIMNEY,
    MODULE_ID.M_ADDON_WINDOWS,
    MODULE_ID.M_ADDON_SNOW,
  ];

  let subtotal_min = 0;
  let subtotal_max = 0;
  let subtotal_expected = 0;

  for (const id of priceModuleIds) {
    const mod = modules[id];
    if (mod && mod.included) {
      subtotal_min += mod.min;
      subtotal_max += mod.max;
      subtotal_expected += mod.expected;
    }
  }

  // Margin
  modules[MODULE_ID.M_MARGIN] = computeMargin({
    area_m2: areaResult.area_m2,
    desired_material: normalized.desired_material,
    subtotal_min,
    subtotal_max,
    subtotal_expected,
  });

  const marginResult = modules[MODULE_ID.M_MARGIN];
  const totalsAfterMargin = marginResult._totals_after_margin;

  const total_min = totalsAfterMargin.min;
  const total_max = totalsAfterMargin.max;
  const total_expected = totalsAfterMargin.expected;

  // ── 7. CONFIDENCE ──
  const confidenceResult = computeConfidence({
    geometry_confidence_base: areaResult.geometry_confidence_base,
    normalized,
    confidence_flags,
  });

  // ── 8. OUTPUT MODE (two-step with caps) ──
  const total_span_ratio =
    total_expected > 0 ? (total_max - total_min) / total_expected : 1.0;

  const { output_mode, caps_applied } = resolveOutputMode({
    confidence: confidenceResult,
    normalized,
    total_span_ratio,
    total_min,
    total_max,
    substrate_result: modules[MODULE_ID.M_SUB_STRUCTURE],
    scaffold_assumption: modules[MODULE_ID.M_SCAFFOLD]?._scaffold_assumption || null,
  });

  // ── 9. BUILD CALCULATED RESULT ──
  const calculated = createCalculatedResult();

  calculated.modules = modules;
  calculated.total_min = total_min;
  calculated.total_max = total_max;
  calculated.total_expected = total_expected;

  calculated.confidence = {
    geometry: confidenceResult.geometry,
    material: confidenceResult.material,
    condition: confidenceResult.condition,
    addon: confidenceResult.addon,
    weighted_before_penalties: confidenceResult.weighted_before_penalties,
    unknown_burden: confidenceResult.unknown_burden,
    total: confidenceResult.total,
    confidence_class: confidenceResult.confidence_class,
  };

  calculated.output_mode = output_mode;
  calculated.output_mode_caps_applied = caps_applied;

  calculated.margin = {
    profile_key: marginResult._profile.profile_key,
    rate: marginResult._profile.rate,
    absolute: marginResult.expected,
    selection_reason: marginResult._profile.selection_reason,
  };

  calculated.floor = {
    applied: marginResult._floor.applied,
    delta_amount: marginResult._floor.delta_amount,
    reason: marginResult._floor.reason,
  };

  calculated.substrate_risk = riskResult.final_risk;
  calculated.asbestos_flag = normalized.asbestos_flag;

  calculated.scaffold_required = modules[MODULE_ID.M_SCAFFOLD].included;
  calculated.scaffold_assumption = modules[MODULE_ID.M_SCAFFOLD]._scaffold_assumption || null;

  calculated.area_m2 = areaResult.area_m2;
  calculated.area_method = areaResult.area_method;
  calculated.slope_factor = areaResult.slope_factor;

  calculated.postal_zone = postal_zone;

  calculated.assumptions = collectAssumptions(modules, areaResult, riskResult);
  calculated.warnings = warnings;

  calculated.lead_quality_score = computeLeadScore(normalized, confidenceResult);

  calculated.created_at = new Date().toISOString();

  // ── 10. BUILD PRESENTED RESULT ──
  const presented = buildPresentedResult(calculated, normalized);

  // ── 11. BUILD SALES GUIDANCE ──
  const sales = buildSalesGuidance(calculated, normalized, riskResult);

  // ── 12. RETURN ALL THREE LAYERS ──
  return {
    calculated_result: calculated,
    presented_result: presented,
    sales_guidance_result: sales,
  };
}


// ── ADDON HELPER: FIXED PRICE (chimney, windows) ──

function computeAddonFixed(moduleId, addonAnswer, cost, description) {
  const base = {
    module_id: moduleId,
    included: false,
    customer_visible: false,
    min: 0,
    max: 0,
    expected: 0,
    assumptions: [],
    flags: [],
  };

  if (addonAnswer === ADDON_ANSWER.YES) {
    const rounded = Math.round(cost);
    return {
      ...base,
      included: true,
      customer_visible: true,
      min: rounded,
      max: rounded,
      expected: rounded,
      assumptions: [description],
    };
  }

  if (addonAnswer === ADDON_ANSWER.UNKNOWN) {
    return {
      ...base,
      included: false,
      customer_visible: false,
      assumptions: ['Not confirmed by customer — excluded from calculation'],
      flags: ['ADDON_NOT_CONFIRMED'],
    };
  }

  // NO
  return {
    ...base,
    assumptions: ['Customer confirmed: not needed'],
  };
}


// ── ADDON HELPER: LPM-BASED (gutters, snow safety) ──
// LPM is estimated from footprint → inherent uncertainty.
// Spread ±15% around expected to reflect facade length estimation.

function computeAddonLpm(moduleId, addonAnswer, estimatedLpm, pricePerLpm, label) {
  const base = {
    module_id: moduleId,
    included: false,
    customer_visible: false,
    min: 0,
    max: 0,
    expected: 0,
    assumptions: [],
    flags: [],
  };

  if (addonAnswer === ADDON_ANSWER.YES) {
    const expected = Math.round(estimatedLpm * pricePerLpm);
    const min = Math.round(estimatedLpm * 0.85 * pricePerLpm);
    const max = Math.round(estimatedLpm * 1.15 * pricePerLpm);

    return {
      ...base,
      included: true,
      customer_visible: true,
      min,
      max,
      expected,
      assumptions: [
        `${label}: ~${estimatedLpm} lpm × ${pricePerLpm} kr/lpm (±15% fasadlängd)`,
      ],
    };
  }

  if (addonAnswer === ADDON_ANSWER.UNKNOWN) {
    return {
      ...base,
      included: false,
      customer_visible: false,
      assumptions: ['Not confirmed by customer — excluded from calculation'],
      flags: ['ADDON_NOT_CONFIRMED'],
    };
  }

  // NO
  return {
    ...base,
    assumptions: ['Customer confirmed: not needed'],
  };
}


// ── COLLECT ASSUMPTIONS ──

function collectAssumptions(modules, areaResult, riskResult) {
  const all = [];

  // Area
  all.push(`Area method: ${areaResult.area_method}, roof area: ${areaResult.area_m2} m²`);

  // Risk
  all.push(
    `Substrate risk: ${riskResult.final_risk} (base: ${riskResult.base_risk}, lift: ${riskResult.symptom_lift})`,
  );

  // Module assumptions
  for (const mod of Object.values(modules)) {
    if (mod.assumptions) {
      all.push(...mod.assumptions);
    }
  }

  return all;
}


// ── LEAD QUALITY SCORE (0–5 simplified MVP) ──

function computeLeadScore(normalized, confidence) {
  let score = 0;

  // Confidence contributes 0-2
  if (confidence.total >= 70) score += 2;
  else if (confidence.total >= 45) score += 1;

  // Timeline contributes 0-2
  if (normalized.lead_timeline === LEAD_TIMELINE.Q_CURRENT) score += 2;
  else if (normalized.lead_timeline === LEAD_TIMELINE.Q_NEXT) score += 1;

  // Ownership contributes 0-1
  if (normalized.ownership_status === OWNERSHIP_STATUS.OWNER) score += 1;

  return Math.min(5, score);
}


// ── SALES GUIDANCE ──

function buildSalesGuidance(calculated, normalized, riskResult) {
  const result = createSalesGuidanceResult();

  // ── HEADLINE ──
  const area = Math.round(calculated.area_m2);
  result.headline = `${area} m² takbyte – ${normalized.desired_material}`;

  // ── PRIORITY ──
  if (calculated.lead_quality_score >= 4) result.priority = 'HIGH';
  else if (calculated.lead_quality_score >= 2) result.priority = 'MEDIUM';
  else result.priority = 'LOW';

  result.lead_quality_score = calculated.lead_quality_score;

  // ── CUSTOMER PRICE EXPECTATION ──
  result.customer_price_expectation = {
    min: calculated.total_min,
    max: calculated.total_max,
  };

  // ── INTERNAL TARGET PRICE ──
  // total_expected already includes M_SUB_STRUCTURE.expected (median substrate cost).
  // No additional substrate overlay — that would be double-counting.
  result.internal_target_price = calculated.total_expected;

  // ── ITEMS TO VERIFY ──
  result.items_to_verify = [];
  if (normalized.existing_material === EXISTING_MATERIAL.UNKNOWN) {
    result.items_to_verify.push('Befintligt takmaterial (okänt)');
  }
  if (normalized.floors === FLOORS.UNKNOWN) {
    result.items_to_verify.push('Antal våningar');
  }
  if (normalized.roof_age_band === ROOF_AGE_BAND.UNKNOWN) {
    result.items_to_verify.push('Takets ålder');
  }
  if (normalized.roof_type === ROOF_TYPE.UNK) {
    result.items_to_verify.push('Taktyp (okänd)');
  }
  if (
    normalized.area_method === AREA_METHOD.FALLBACK ||
    normalized.area_method === AREA_METHOD.SIZE_CLASS
  ) {
    result.items_to_verify.push(`Takyta (${normalized.area_method === AREA_METHOD.FALLBACK ? 'grov uppskattning' : 'storleksklass'})`);
  }

  // ── RISK FLAGS ──
  result.risk_flags = [];
  if (calculated.asbestos_flag) {
    result.risk_flags.push('ASBEST — hantera med specialistföretag');
  }
  if (
    riskResult.final_risk === SUBSTRATE_RISK.MED_HIGH ||
    riskResult.final_risk === SUBSTRATE_RISK.HIGH
  ) {
    result.risk_flags.push(`Hög risk för underlagsarbete (${riskResult.final_risk})`);
  }

  result.assumptions = calculated.assumptions;

  // ── PRIMARY VERIFICATION TARGET ──
  // What must sales verify FIRST? Rank by pricing impact.
  result.primary_verification_target = resolvePrimaryVerification(normalized, calculated);

  // ── LARGEST PRICE RISK DRIVER ──
  // Module with the biggest span (max - min) = biggest cost uncertainty.
  result.largest_price_risk_driver = resolveLargestPriceRisk(calculated.modules);

  // ── LARGEST UNCERTAINTY DRIVER ──
  // Which unknown has the biggest confidence impact?
  result.largest_uncertainty_driver = resolveLargestUncertainty(normalized, calculated);

  // ── PRICING POSTURE ──
  // Should price be discussed now or after inspection?
  result.pricing_posture = resolvePricingPosture(calculated.output_mode);

  // ── RECOMMENDED SALES ACTION ──
  result.recommended_sales_action = resolveRecommendedAction(
    calculated.output_mode,
    result.primary_verification_target,
    calculated.confidence.total,
  );

  // ── INSPECTION PRIORITY ──
  result.inspection_priority = resolveInspectionPriority(
    riskResult,
    calculated.confidence.total,
    calculated.scaffold_assumption,
  );

  // ── TALKING POINTS ──
  result.talking_points = buildTalkingPoints(calculated, normalized, riskResult);

  // ── FLOOR INFO ──
  if (calculated.floor.applied) {
    result.floor_info = {
      applied: true,
      delta: calculated.floor.delta_amount,
      reason: calculated.floor.reason,
    };
  }

  // ── SCAFFOLD INFO ──
  if (calculated.scaffold_required) {
    result.scaffold_info = {
      required: true,
      assumption: calculated.scaffold_assumption,
    };
  }

  return result;
}


// ── SALES GUIDANCE HELPERS ──

function resolvePrimaryVerification(normalized, calculated) {
  // Priority order: what has the biggest impact on price accuracy?

  // 1. Unknown area is the #1 driver — everything scales from it
  if (
    normalized.area_method === AREA_METHOD.FALLBACK ||
    normalized.area_method === AREA_METHOD.SIZE_CLASS
  ) {
    return {
      field: 'area_m2',
      reason: 'Takyta är uppskattad — alla kostnader skalas från denna',
      action: 'Mät eller verifiera takytan vid besök',
    };
  }

  // 2. Unknown material — affects demolition cost and asbestos risk
  if (normalized.existing_material === EXISTING_MATERIAL.UNKNOWN) {
    return {
      field: 'existing_material',
      reason: 'Befintligt material okänt — påverkar rivningskostnad och asbestrisk',
      action: 'Fråga kunden eller inspektera vid besök',
    };
  }

  // 3. Unknown roof age — affects substrate risk assessment
  if (normalized.roof_age_band === ROOF_AGE_BAND.UNKNOWN) {
    return {
      field: 'roof_age_band',
      reason: 'Takets ålder okänd — påverkar bedömning av underlagsskick',
      action: 'Fråga kunden om takets ungefärliga ålder',
    };
  }

  // 4. Unknown roof type — affects complexity and slope
  if (normalized.roof_type === ROOF_TYPE.UNK) {
    return {
      field: 'roof_type',
      reason: 'Taktyp okänd — påverkar komplexitet och tidsåtgång',
      action: 'Fråga kunden eller identifiera via bild',
    };
  }

  return null;
}


function resolveLargestPriceRisk(modules) {
  let maxSpan = 0;
  let maxModule = null;

  const LABEL = {
    [MODULE_ID.M_BASE]: 'Material och arbete',
    [MODULE_ID.M_DEMO]: 'Rivning',
    [MODULE_ID.M_SUB_STRUCTURE]: 'Underlagskonstruktion',
    [MODULE_ID.M_SCAFFOLD]: 'Ställning',
    [MODULE_ID.M_ADDON_GUTTERS]: 'Hängrännor',
    [MODULE_ID.M_ADDON_CHIMNEY]: 'Skorstensbeslag',
    [MODULE_ID.M_ADDON_WINDOWS]: 'Takfönster',
    [MODULE_ID.M_ADDON_SNOW]: 'Snörasskydd',
  };

  for (const [id, mod] of Object.entries(modules)) {
    if (!mod || !mod.included) continue;
    const span = mod.max - mod.min;
    if (span > maxSpan) {
      maxSpan = span;
      maxModule = id;
    }
  }

  if (!maxModule || maxSpan === 0) return null;

  return {
    module_id: maxModule,
    label: LABEL[maxModule] || maxModule,
    span: maxSpan,
    reason: `Prisintervall ${maxSpan.toLocaleString('sv-SE')} kr`,
  };
}


function resolveLargestUncertainty(normalized, calculated) {
  // Check which unknown has the highest burden weight
  const unknowns = [];

  if (normalized.roof_type === ROOF_TYPE.UNK) {
    unknowns.push({ field: 'roof_type', label: 'Taktyp', weight: 3.0 });
  }
  if (
    normalized.area_method === AREA_METHOD.FALLBACK
  ) {
    unknowns.push({ field: 'area_method', label: 'Takyta (fallback)', weight: 3.0 });
  } else if (normalized.area_method === AREA_METHOD.SIZE_CLASS) {
    unknowns.push({ field: 'area_method', label: 'Takyta (storleksklass)', weight: 2.0 });
  }
  if (normalized.roof_age_band === ROOF_AGE_BAND.UNKNOWN) {
    unknowns.push({ field: 'roof_age_band', label: 'Takets ålder', weight: 2.0 });
  }
  if (normalized.existing_material === EXISTING_MATERIAL.UNKNOWN) {
    unknowns.push({ field: 'existing_material', label: 'Befintligt material', weight: 1.5 });
  }
  if (normalized.symptom_flags.includes(SYMPTOM.UNKNOWN)) {
    unknowns.push({ field: 'symptom_flags', label: 'Symptom', weight: 1.5 });
  }

  if (unknowns.length === 0) return null;

  // Return the one with the highest weight
  unknowns.sort((a, b) => b.weight - a.weight);
  return {
    field: unknowns[0].field,
    label: unknowns[0].label,
    weight: unknowns[0].weight,
    total_unknowns: unknowns.length,
  };
}


function resolvePricingPosture(outputMode) {
  switch (outputMode) {
    case OUTPUT_MODE.FULL_INTERVAL:
    case OUTPUT_MODE.QUALIFIED_INTERVAL:
      return 'PRESENT_NOW';
    case OUTPUT_MODE.PRICE_LEVEL_ONLY:
      return 'WAIT_FOR_INSPECTION';
    case OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED:
    default:
      return 'CONTACT_ONLY';
  }
}


function resolveRecommendedAction(outputMode, primaryVerification, confidenceTotal) {
  if (outputMode === OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED) {
    return 'Kontakta kunden, ge inget pris. Boka besiktning.';
  }
  if (outputMode === OUTPUT_MODE.PRICE_LEVEL_ONLY) {
    const verify = primaryVerification
      ? ` Verifiera först: ${primaryVerification.action}.`
      : '';
    return `Nämn ungefärlig prisnivå, betona att besiktning krävs.${verify}`;
  }
  if (confidenceTotal >= 65) {
    return 'Presentera prisintervall med tillförsikt. Boka besiktning för fast pris.';
  }
  const verify = primaryVerification
    ? ` Verifiera: ${primaryVerification.action}.`
    : '';
  return `Presentera prisintervall men flagga osäkerheter.${verify}`;
}


function resolveInspectionPriority(riskResult, confidenceTotal, scaffoldAssumption) {
  // HIGH: substrate risk is elevated or confidence is low
  if (
    riskResult.final_risk === SUBSTRATE_RISK.MED_HIGH ||
    riskResult.final_risk === SUBSTRATE_RISK.HIGH ||
    confidenceTotal < 40
  ) {
    return 'HIGH';
  }

  // MEDIUM: scaffold assumed, moderate confidence, or mid-range substrate risk
  if (
    scaffoldAssumption === SCAFFOLD_ASSUMPTION.ASSUMED ||
    confidenceTotal < 60 ||
    riskResult.final_risk === SUBSTRATE_RISK.MED
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
}


function buildTalkingPoints(calculated, normalized, riskResult) {
  const points = [];

  // Area context
  if (
    normalized.area_method === AREA_METHOD.FALLBACK ||
    normalized.area_method === AREA_METHOD.SIZE_CLASS
  ) {
    points.push('Takytan är uppskattad och kan skilja sig — slutpris justeras efter uppmätning.');
  }

  // Substrate risk
  if (
    riskResult.final_risk === SUBSTRATE_RISK.MED_HIGH ||
    riskResult.final_risk === SUBSTRATE_RISK.HIGH
  ) {
    points.push('Det finns risk att underlagskonstruktionen behöver bytas helt eller delvis — detta avgörs vid besiktning.');
  } else if (riskResult.final_risk === SUBSTRATE_RISK.MED) {
    points.push('Underlagskonstruktionen kan behöva partiellt byte — avgörs vid besiktning.');
  }

  // Floor protection
  if (calculated.floor.applied) {
    points.push('Priset inkluderar en miniminivå för att täcka fasta projektkostnader.');
  }

  // Scaffold
  if (calculated.scaffold_assumption === SCAFFOLD_ASSUMPTION.ASSUMED) {
    points.push('Byggnadsställning är inkluderad som antagande — bekräftas vid besiktning.');
  }

  // Unknown material
  if (normalized.existing_material === EXISTING_MATERIAL.UNKNOWN) {
    points.push('Vi behöver veta befintligt takmaterial för att precisera rivningskostnaden.');
  }

  // Asbestos
  if (calculated.asbestos_flag) {
    points.push('Eternit/asbest har identifierats — detta hanteras av specialistföretag och ingår inte i offerten.');
  }

  // Addons not confirmed
  const unconfirmedAddons = [];
  if (normalized.addon_gutters === ADDON_ANSWER.UNKNOWN) unconfirmedAddons.push('hängrännor');
  if (normalized.addon_chimney?.action === ADDON_ANSWER.UNKNOWN) unconfirmedAddons.push('skorstensbeslag');
  if (normalized.addon_roof_windows?.action === ADDON_ANSWER.UNKNOWN) unconfirmedAddons.push('takfönster');
  if (normalized.addon_snow_safety === ADDON_ANSWER.UNKNOWN) unconfirmedAddons.push('snörasskydd');

  if (unconfirmedAddons.length > 0) {
    points.push(`Tillval ej bekräftade: ${unconfirmedAddons.join(', ')} — kan läggas till vid offert.`);
  }

  return points;
}
