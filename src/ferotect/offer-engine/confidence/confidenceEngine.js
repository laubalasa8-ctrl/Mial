import {
  CONFIDENCE_CLASS,
  CONFIDENCE_FLAG,
  AREA_METHOD,
  ROOF_TYPE,
  ROOF_AGE_BAND,
  SYMPTOM,
  ADDON_ANSWER,
  FLOORS,
  PROPERTY_ACCESS,
  EXISTING_MATERIAL,
} from '../contracts/enums.js';
import rulesConfig from '../config/rules.config.js';

/**
 * Confidence Engine
 *
 * Computes confidence scores across four domains:
 *   geometry (0.0–1.0), material (0.0–1.0), condition (0.0–1.0), addon (0.0–1.0)
 *
 * Then:
 *   1. Weighted sum → base confidence
 *   2. Unknown burden penalty → multiplier
 *   3. Combination penalties → multiplier
 *   4. Final total → 0–100
 *   5. Classify → HIGH / MEDIUM / LOW / INSUFFICIENT
 *
 * @param {object} params
 * @param {number} params.geometry_confidence_base - From area engine (0.0–1.0)
 * @param {object} params.normalized - Normalized input
 * @param {object} params.confidence_flags - Per-field confidence flags
 * @returns {object} Full confidence result
 */
export default function computeConfidence({
  geometry_confidence_base,
  normalized,
  confidence_flags,
}) {
  // ── DOMAIN SCORES ──
  const geometry = computeGeometry(geometry_confidence_base, normalized, confidence_flags);
  const material = computeMaterial(normalized, confidence_flags);
  const condition = computeCondition(normalized, confidence_flags);
  const addon = computeAddon(normalized, confidence_flags);

  // ── WEIGHTED SUM ──
  const w = rulesConfig.confidence_weights;
  const weightedRaw =
    geometry * w.geometry +
    material * w.material +
    condition * w.condition +
    addon * w.addon;

  // ── UNKNOWN BURDEN ──
  const unknownBurden = computeUnknownBurden(normalized, confidence_flags);
  const burdenPenalty = resolveBurdenPenalty(unknownBurden);

  // ── COMBINATION PENALTIES ──
  // Each penalty targets a specific pair of unknowns that compound
  // pricing uncertainty beyond what the individual domain scores capture.
  let combinationPenalty = 1.0;

  // Weak geometry + weak condition → substrate cost is a pure guess
  if (geometry < 0.3 && condition < 0.3) {
    combinationPenalty *= 0.70;
  }

  // Old roof estimated with rough area → both primary cost drivers are soft
  if (
    normalized.area_method === AREA_METHOD.SIZE_CLASS &&
    normalized.roof_age_band === ROOF_AGE_BAND.GT_50
  ) {
    combinationPenalty *= 0.85;
  }

  // Unknown roof type + fallback/size_class area → geometry is almost meaningless
  if (
    normalized.roof_type === ROOF_TYPE.UNK &&
    (normalized.area_method === AREA_METHOD.FALLBACK ||
     normalized.area_method === AREA_METHOD.SIZE_CLASS)
  ) {
    combinationPenalty *= 0.75;
  }

  // Unknown material + weak area → both demolition and base cost anchors are soft
  if (
    normalized.existing_material === EXISTING_MATERIAL.UNKNOWN &&
    (normalized.area_method === AREA_METHOD.FALLBACK ||
     normalized.area_method === AREA_METHOD.SIZE_CLASS)
  ) {
    combinationPenalty *= 0.85;
  }

  // Weak material knowledge + weak condition → can't assess demo cost on risky substrate
  if (material < 0.5 && condition < 0.3) {
    combinationPenalty *= 0.85;
  }

  // ── FINAL ──
  const total = Math.round(weightedRaw * burdenPenalty * combinationPenalty * 100);
  const clampedTotal = Math.max(0, Math.min(100, total));
  const confidenceClass = classifyConfidence(clampedTotal);

  return {
    geometry,
    material,
    condition,
    addon,
    weighted_before_penalties: Math.round(weightedRaw * 100),
    unknown_burden: unknownBurden,
    burden_penalty: burdenPenalty,
    combination_penalty: combinationPenalty,
    total: clampedTotal,
    confidence_class: confidenceClass,
  };
}


// ── DOMAIN: GEOMETRY ──

function computeGeometry(base, normalized, flags) {
  let score = base;

  // Penalty if roof type unknown — complexity factor and slope factor are guessed
  if (normalized.roof_type === ROOF_TYPE.UNK) {
    score -= 0.10;
  }

  // Penalty if floors unknown
  if (normalized.floors === FLOORS.UNKNOWN) {
    score -= 0.05;
  }

  // Penalty if property_access was inferred (not verified)
  if (flags.property_access === CONFIDENCE_FLAG.INFERRED) {
    score -= 0.03;
  }

  return Math.max(0, Math.min(1, score));
}


// ── DOMAIN: MATERIAL ──

function computeMaterial(normalized, flags) {
  // desired_material is always provided (hard blocker)
  if (normalized.existing_material !== EXISTING_MATERIAL.UNKNOWN) {
    // Verified by user = full confidence. Inferred = slight deduction.
    return flags.existing_material === CONFIDENCE_FLAG.VERIFIED ? 1.0 : 0.9;
  }
  // Unknown existing material significantly affects demolition cost,
  // asbestos risk, and overall pricing accuracy.
  return 0.5;
}


// ── DOMAIN: CONDITION ──

function computeCondition(normalized, flags) {
  const ageKnown = normalized.roof_age_band !== ROOF_AGE_BAND.UNKNOWN;
  const hasExplicitNone = normalized.symptom_flags.includes(SYMPTOM.NONE);

  // Check if there's at least one concrete symptom (not UNKNOWN, not NONE)
  const concreteSymptoms = normalized.symptom_flags.filter(
    (s) => s !== SYMPTOM.UNKNOWN && s !== SYMPTOM.NONE
  );
  const hasConcreteSymptoms = concreteSymptoms.length > 0;

  // Distinguish: user gave real info vs just UNKNOWN
  const symptomsProvided = hasConcreteSymptoms || hasExplicitNone;

  if (ageKnown && symptomsProvided) {
    // NONE is slightly less confident than specific symptoms
    // (user might not know what to look for)
    return hasExplicitNone ? 0.9 : 1.0;
  }
  if (ageKnown && !symptomsProvided) {
    return 0.5;
  }
  if (!ageKnown && symptomsProvided) {
    return 0.4;
  }
  // Both unknown — near-zero useful condition information.
  // 0.10 reflects that we're essentially guessing substrate risk.
  return 0.10;
}


// ── DOMAIN: ADDON ──

function computeAddon(normalized, flags) {
  const addonEntries = [
    { value: normalized.addon_gutters, flag: flags.addon_gutters },
    { value: normalized.addon_chimney?.action, flag: flags.addon_chimney },
    { value: normalized.addon_roof_windows?.action, flag: flags.addon_roof_windows },
    { value: normalized.addon_snow_safety, flag: flags.addon_snow_safety },
  ];

  let score = 0;
  const total = addonEntries.length;

  for (const entry of addonEntries) {
    if (!entry.value || entry.value === ADDON_ANSWER.UNKNOWN) {
      // Not answered — no contribution
      continue;
    }
    if (entry.flag === CONFIDENCE_FLAG.INFERRED) {
      score += 0.8; // Inferred is worth less than verified
    } else {
      score += 1.0;
    }
  }

  const normalized_score = score / total;
  if (normalized_score >= 1.0) return 1.0;
  if (normalized_score >= 0.75) return 0.8;
  if (normalized_score >= 0.5) return 0.6;
  if (normalized_score > 0) return 0.3;
  // Total ignorance about add-ons = zero confidence contribution
  return 0.0;
}


// ── UNKNOWN BURDEN ──

function computeUnknownBurden(normalized, flags) {
  const weights = rulesConfig.unknown_burden_weights;
  let burden = 0;

  if (normalized.roof_type === ROOF_TYPE.UNK) {
    burden += weights.roof_type;
  }
  if (normalized.area_method === AREA_METHOD.FALLBACK) {
    burden += weights.area_fallback;
  } else if (normalized.area_method === AREA_METHOD.SIZE_CLASS) {
    burden += weights.area_size_class;
  }
  if (normalized.existing_material === EXISTING_MATERIAL.UNKNOWN) {
    burden += weights.existing_material;
  }
  if (normalized.roof_age_band === ROOF_AGE_BAND.UNKNOWN) {
    burden += weights.roof_age_band;
  }
  if (normalized.symptom_flags.includes(SYMPTOM.UNKNOWN)) {
    burden += weights.symptom_flags;
  }
  if (normalized.floors === FLOORS.UNKNOWN) {
    burden += weights.floors;
  }
  if (normalized.property_access === PROPERTY_ACCESS.UNKNOWN) {
    burden += weights.property_access;
  }
  if (normalized.addon_gutters === ADDON_ANSWER.UNKNOWN) {
    burden += weights.addon_gutters;
  }
  if (normalized.addon_chimney?.action === ADDON_ANSWER.UNKNOWN) {
    burden += weights.addon_chimney;
  }
  if (normalized.addon_roof_windows?.action === ADDON_ANSWER.UNKNOWN) {
    burden += weights.addon_roof_windows;
  }
  if (normalized.addon_snow_safety === ADDON_ANSWER.UNKNOWN) {
    burden += weights.addon_snow_safety;
  }

  return Math.round(burden * 10) / 10;
}


// ── BURDEN PENALTY LOOKUP ──

function resolveBurdenPenalty(burden) {
  const thresholds = rulesConfig.unknown_burden_thresholds;
  for (const t of thresholds) {
    if (burden <= t.max) {
      return t.penalty;
    }
  }
  return 0.50;
}


// ── CLASSIFICATION ──

function classifyConfidence(total) {
  const t = rulesConfig.confidence_class_thresholds;
  if (total >= t.high) return CONFIDENCE_CLASS.HIGH;
  if (total >= t.medium) return CONFIDENCE_CLASS.MEDIUM;
  if (total >= t.low) return CONFIDENCE_CLASS.LOW;
  return CONFIDENCE_CLASS.INSUFFICIENT;
}
