import {
  OUTPUT_MODE,
  ROOF_TYPE,
  DESIRED_MATERIAL,
  EXISTING_MATERIAL,
  AREA_METHOD,
  ADDON_ANSWER,
  MODULE_ID,
} from '../contracts/enums.js';
import { createPresentedResult } from '../contracts/outputSchema.js';
import { roundUpTo, roundDownTo } from '../utils/money.js';

// ── LABELS ──

const ROOF_TYPE_LABEL = {
  [ROOF_TYPE.SAD]: 'Sadeltak',
  [ROOF_TYPE.VAL]: 'Valmat tak',
  [ROOF_TYPE.PUL]: 'Pulpettak',
  [ROOF_TYPE.KOM]: 'Kombinerat tak',
  [ROOF_TYPE.PLA]: 'Platt tak',
  [ROOF_TYPE.UNK]: 'Taktyp ej angiven',
};

const DESIRED_MATERIAL_LABEL = {
  [DESIRED_MATERIAL.BETONG_STANDARD]: 'Betongpannor (standard)',
  [DESIRED_MATERIAL.LERTEGEL]: 'Lertegel',
  [DESIRED_MATERIAL.PLAT_SF]: 'Skivplåt / falsad plåt',
  [DESIRED_MATERIAL.PLAT_LP]: 'Lättprofilerad plåt',
};

const EXISTING_MATERIAL_LABEL = {
  [EXISTING_MATERIAL.BETONG]: 'Betongpannor',
  [EXISTING_MATERIAL.TEGEL]: 'Tegelpannor',
  [EXISTING_MATERIAL.PLAT]: 'Plåt',
  [EXISTING_MATERIAL.PAPP]: 'Papp',
  [EXISTING_MATERIAL.ETERNIT]: 'Eternit',
  [EXISTING_MATERIAL.OTHER]: 'Annat material',
  [EXISTING_MATERIAL.UNKNOWN]: 'Okänt befintligt material',
};

const OUTPUT_MODE_ROUNDING = {
  [OUTPUT_MODE.FULL_INTERVAL]: 5000,
  [OUTPUT_MODE.QUALIFIED_INTERVAL]: 5000,
  [OUTPUT_MODE.PRICE_LEVEL_ONLY]: 25000,
};

const CONFIDENCE_TEXTS = {
  [OUTPUT_MODE.FULL_INTERVAL]:
    'Denna prisuppskattning baseras på tillräcklig information för att ge ett relativt träffsäkert intervall.',
  [OUTPUT_MODE.QUALIFIED_INTERVAL]:
    'Vi har tillräckligt med information för ett ungefärligt prisintervall, men några osäkra poster kan påverka slutpriset.',
  [OUTPUT_MODE.PRICE_LEVEL_ONLY]:
    'Baserat på den information vi har kan vi ge en ungefärlig prisnivå. En besiktning behövs för exakt pris.',
  [OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED]:
    'Vi behöver mer information för att kunna ge en prisuppskattning. Kontakta oss för en kostnadsfri besiktning.',
};

const NEXT_STEP = {
  [OUTPUT_MODE.FULL_INTERVAL]: {
    type: 'BOOK_INSPECTION',
    text: 'Boka en kostnadsfri besiktning för att få ett fast pris.',
  },
  [OUTPUT_MODE.QUALIFIED_INTERVAL]: {
    type: 'BOOK_INSPECTION',
    text: 'Boka en kostnadsfri besiktning – det finns osäkra poster som behöver verifieras på plats.',
  },
  [OUTPUT_MODE.PRICE_LEVEL_ONLY]: {
    type: 'BOOK_INSPECTION',
    text: 'Boka en kostnadsfri besiktning för en exakt bedömning.',
  },
  [OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED]: {
    type: 'CONTACT_US',
    text: 'Kontakta oss direkt så hjälper vi dig vidare.',
  },
};


/**
 * Build the customer-facing presented result.
 *
 * SECURITY: This function MUST NEVER expose:
 * - margin rate/amount/profile
 * - floor internals (delta, reason)
 * - lead_quality_score
 * - internal_target_price
 * - raw module breakdowns (_breakdown)
 *
 * @param {object} calculated - The full calculated_result
 * @param {object} normalized - Normalized input
 * @returns {object} Customer-safe presented_result
 */
export default function buildPresentedResult(calculated, normalized) {
  const result = createPresentedResult();
  const mode = calculated.output_mode;

  // ── SUMMARY ──
  result.summary.roof_type_label = ROOF_TYPE_LABEL[normalized.roof_type] || 'Okänt';
  result.summary.desired_material_label =
    DESIRED_MATERIAL_LABEL[normalized.desired_material] || '';
  result.summary.existing_material_label =
    EXISTING_MATERIAL_LABEL[normalized.existing_material] || '';

  result.summary.area_estimate_label = formatAreaLabel(
    calculated.area_m2,
    calculated.area_method,
  );

  result.summary.location_label = normalized.postal_code || '';
  result.summary.timeline_label = normalized.lead_timeline || '';

  // Selected addons
  result.summary.selected_addons = buildSelectedAddons(normalized);

  // Uncertain items
  result.summary.uncertain_items = buildUncertainItems(calculated);

  // ── PRICE ──
  result.price.output_mode = mode;

  if (mode === OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED) {
    result.price.interval_min = null;
    result.price.interval_max = null;
    result.price.line_items = [];
  } else {
    const rounding = OUTPUT_MODE_ROUNDING[mode] || 5000;
    result.price.interval_min = roundDownTo(calculated.total_min, rounding);
    result.price.interval_max = roundUpTo(calculated.total_max, rounding);
    result.price.line_items = buildLineItems(calculated, mode);
  }

  // ── CONFIDENCE TEXT ──
  result.confidence_text = CONFIDENCE_TEXTS[mode] || '';

  // ── NEXT STEP ──
  const step = NEXT_STEP[mode] || NEXT_STEP[OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED];
  result.next_step_type = step.type;
  result.next_step_text = step.text;

  return result;
}


// ── HELPERS ──

function formatAreaLabel(area_m2, area_method) {
  if (!area_m2) return 'Takyta ej beräknad';
  const rounded = Math.round(area_m2);
  switch (area_method) {
    case AREA_METHOD.EXACT:
      return `ca ${rounded} m²`;
    case AREA_METHOD.FOOTPRINT_CALC:
      return `ca ${rounded} m² (beräknad från bottenyta)`;
    case AREA_METHOD.SIZE_CLASS:
      return `ca ${rounded} m² (uppskattat)`;
    case AREA_METHOD.FALLBACK:
      return `ca ${rounded} m² (grov uppskattning)`;
    default:
      return `ca ${rounded} m²`;
  }
}

function buildSelectedAddons(normalized) {
  const addons = [];
  if (normalized.addon_gutters === ADDON_ANSWER.YES) addons.push('Hängrännor');
  if (normalized.addon_chimney?.action === ADDON_ANSWER.YES) addons.push('Skorstensbeslag');
  if (normalized.addon_roof_windows?.action === ADDON_ANSWER.YES)
    addons.push('Takfönster');
  if (normalized.addon_snow_safety === ADDON_ANSWER.YES) addons.push('Snörasskydd');
  return addons;
}

function buildUncertainItems(calculated) {
  const items = [];
  const modules = calculated.modules;

  if (modules[MODULE_ID.M_SUB_STRUCTURE]?.included) {
    items.push('Underlagskonstruktion (avgörs vid besiktning)');
  }
  if (modules[MODULE_ID.M_DEMO]?.flags?.includes('ASBESTOS_DETECTED')) {
    items.push('Eternithantering (kräver specialistbedömning)');
  }
  if (modules[MODULE_ID.M_SCAFFOLD]?.flags?.includes('SCAFFOLD_ASSUMED')) {
    items.push('Byggnadsställning (antagande – verifieras vid besiktning)');
  }

  return items;
}

function buildLineItems(calculated, mode) {
  const items = [];
  const modules = calculated.modules;

  // Only show customer_visible modules
  const moduleOrder = [
    { id: MODULE_ID.M_BASE, label: 'Takbyte och material' },
    { id: MODULE_ID.M_DEMO, label: 'Rivning av befintligt tak' },
    { id: MODULE_ID.M_SUB_STRUCTURE, label: 'Underlagskonstruktion (om det behövs)' },
    { id: MODULE_ID.M_SCAFFOLD, label: 'Byggnadsställning' },
    { id: MODULE_ID.M_ADDON_GUTTERS, label: 'Hängrännor' },
    { id: MODULE_ID.M_ADDON_CHIMNEY, label: 'Skorstensbeslag' },
    { id: MODULE_ID.M_ADDON_WINDOWS, label: 'Takfönster' },
    { id: MODULE_ID.M_ADDON_SNOW, label: 'Snörasskydd' },
  ];

  const rounding = OUTPUT_MODE_ROUNDING[mode] || 5000;

  for (const entry of moduleOrder) {
    const mod = modules[entry.id];
    if (!mod || !mod.included || !mod.customer_visible) continue;

    // PRICE_LEVEL_ONLY: don't show individual line items
    if (mode === OUTPUT_MODE.PRICE_LEVEL_ONLY) continue;

    const isUncertain = mod.min !== mod.max && (mod.max - mod.min) / mod.expected > 0.3;

    items.push({
      label: entry.label,
      amount_label: formatModuleAmount(mod, rounding),
      is_uncertain: isUncertain,
    });
  }

  return items;
}

function formatModuleAmount(mod, rounding) {
  if (mod.min === 0 && mod.max === 0) return 'Ingår';
  const roundedMin = roundDownTo(mod.min, Math.min(rounding, 1000));
  const roundedMax = roundUpTo(mod.max, Math.min(rounding, 1000));
  if (roundedMin === roundedMax) {
    return `${roundedMin.toLocaleString('sv-SE')} kr`;
  }
  return `${roundedMin.toLocaleString('sv-SE')} – ${roundedMax.toLocaleString('sv-SE')} kr`;
}
