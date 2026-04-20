import {
  OUTPUT_MODE,
  OUTPUT_MODE_ORDER,
  ROOF_TYPE,
  MVP_SUPPORTED_ROOF_TYPES,
  AREA_METHOD,
  EXISTING_MATERIAL,
  SCAFFOLD_ASSUMPTION,
} from '../contracts/enums.js';
import rulesConfig from '../config/rules.config.js';

/**
 * Two-step output mode determination:
 *
 * STEP 1: Preliminary output mode from confidence class.
 * STEP 2: Apply caps that can ONLY LOWER the mode (never raise).
 *
 * @param {object} params
 * @param {object} params.confidence - Confidence result from confidenceEngine
 * @param {object} params.normalized - Normalized input
 * @param {number} params.total_span_ratio - (total_max - total_min) / total_expected
 * @param {number} params.total_min - Absolute total min
 * @param {number} params.total_max - Absolute total max
 * @param {object} params.substrate_result - M_SUB_STRUCTURE module result
 * @param {string|null} params.scaffold_assumption - SCAFFOLD_ASSUMPTION enum or null
 * @returns {{ output_mode: string, caps_applied: string[] }}
 */
export default function resolveOutputMode({
  confidence,
  normalized,
  total_span_ratio,
  total_min,
  total_max,
  substrate_result,
  scaffold_assumption,
}) {
  // ── STEP 1: PRELIMINARY MODE FROM CONFIDENCE ──
  const preliminary = preliminaryFromConfidence(confidence.total);

  // ── STEP 2: CAPS (can only lower) ──
  const caps_applied = [];
  let capped = preliminary;

  // Cap: Asbestos detected → contact required
  if (normalized.asbestos_flag) {
    capped = applyCapDown(capped, OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED);
    caps_applied.push('ASBESTOS_DETECTED');
  }

  // Cap: Unsupported roof type (KOM, PLA) → contact required
  if (!MVP_SUPPORTED_ROOF_TYPES.includes(normalized.roof_type)) {
    capped = applyCapDown(capped, OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED);
    caps_applied.push('UNSUPPORTED_ROOF_TYPE');
  }

  // Cap: UNK roof type → max price level
  if (normalized.roof_type === ROOF_TYPE.UNK) {
    capped = applyCapDown(capped, OUTPUT_MODE.PRICE_LEVEL_ONLY);
    caps_applied.push('UNKNOWN_ROOF_TYPE');
  }

  // Cap: Fallback area → max price level
  if (normalized.area_method === AREA_METHOD.FALLBACK) {
    capped = applyCapDown(capped, OUTPUT_MODE.PRICE_LEVEL_ONLY);
    caps_applied.push('FALLBACK_AREA');
  }

  // Cap: Size class area → max qualified interval (estimated, not measured)
  if (normalized.area_method === AREA_METHOD.SIZE_CLASS) {
    capped = applyCapDown(capped, OUTPUT_MODE.QUALIFIED_INTERVAL);
    caps_applied.push('SIZE_CLASS_AREA');
  }

  // Cap: Scaffold assumed → max qualified interval (unverified ~40k+ item)
  if (scaffold_assumption === SCAFFOLD_ASSUMPTION.ASSUMED) {
    capped = applyCapDown(capped, OUTPUT_MODE.QUALIFIED_INTERVAL);
    caps_applied.push('SCAFFOLD_ASSUMED');
  }

  // Cap: Combined UNK roof type + SIZE_CLASS area → both geometry anchors are soft
  if (
    normalized.roof_type === ROOF_TYPE.UNK &&
    normalized.area_method === AREA_METHOD.SIZE_CLASS
  ) {
    capped = applyCapDown(capped, OUTPUT_MODE.PRICE_LEVEL_ONLY);
    caps_applied.push('UNK_ROOF_PLUS_SIZE_CLASS');
  }

  // Cap: Unknown material + weak area → demolition and base cost both unanchored
  if (
    normalized.existing_material === EXISTING_MATERIAL.UNKNOWN &&
    (normalized.area_method === AREA_METHOD.FALLBACK ||
     normalized.area_method === AREA_METHOD.SIZE_CLASS)
  ) {
    capped = applyCapDown(capped, OUTPUT_MODE.PRICE_LEVEL_ONLY);
    caps_applied.push('UNKNOWN_MATERIAL_PLUS_WEAK_AREA');
  }

  // Cap: Span ratio exceeds thresholds
  const spanT = rulesConfig.span_thresholds;
  if (total_span_ratio > spanT.price_level_max) {
    capped = applyCapDown(capped, OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED);
    caps_applied.push('EXTREME_SPAN');
  } else if (total_span_ratio > spanT.qualified_interval_max) {
    capped = applyCapDown(capped, OUTPUT_MODE.PRICE_LEVEL_ONLY);
    caps_applied.push('HIGH_SPAN');
  } else if (total_span_ratio > spanT.full_interval_max) {
    capped = applyCapDown(capped, OUTPUT_MODE.QUALIFIED_INTERVAL);
    caps_applied.push('MODERATE_SPAN');
  }

  // Cap: Deceptive precision — confidence is moderate but span is suspiciously narrow.
  // A very narrow span with low-to-moderate confidence means the engine is hiding
  // real uncertainty behind modules that happen to have min=max (no variance).
  if (confidence.total < 55 && total_span_ratio < 0.10) {
    capped = applyCapDown(capped, OUTPUT_MODE.QUALIFIED_INTERVAL);
    caps_applied.push('DECEPTIVE_PRECISION');
  }

  // Cap: Dominant substrate (sub_structure span dominates total price span)
  if (substrate_result && substrate_result.included) {
    const subSpan = substrate_result.max - substrate_result.min;
    const totalSpan = (total_max || 0) - (total_min || 0);
    if (totalSpan > 0) {
      const dominantShare = subSpan / totalSpan;
      if (dominantShare >= rulesConfig.dominant_substrate_threshold) {
        capped = applyCapDown(capped, OUTPUT_MODE.QUALIFIED_INTERVAL);
        caps_applied.push('DOMINANT_SUBSTRATE_RISK');
      }
    }
  }

  // Cap: High unknown burden → lower
  if (confidence.unknown_burden > 6.0) {
    capped = applyCapDown(capped, OUTPUT_MODE.PRICE_LEVEL_ONLY);
    caps_applied.push('HIGH_UNKNOWN_BURDEN');
  } else if (confidence.unknown_burden > 4.0) {
    capped = applyCapDown(capped, OUTPUT_MODE.QUALIFIED_INTERVAL);
    caps_applied.push('MODERATE_UNKNOWN_BURDEN');
  }

  return {
    output_mode: capped,
    caps_applied,
  };
}


/**
 * Map confidence total (0–100) → preliminary output mode.
 */
function preliminaryFromConfidence(total) {
  const t = rulesConfig.output_mode_confidence;
  if (total >= t.full_interval_min) return OUTPUT_MODE.FULL_INTERVAL;
  if (total >= t.qualified_interval_min) return OUTPUT_MODE.QUALIFIED_INTERVAL;
  if (total >= t.price_level_min) return OUTPUT_MODE.PRICE_LEVEL_ONLY;
  return OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED;
}


/**
 * Apply a cap that can only LOWER the output mode (move toward stricter).
 * OUTPUT_MODE_ORDER: index 0 = strictest (NO_PRICE), index 3 = loosest (FULL_INTERVAL).
 */
function applyCapDown(current, capTo) {
  const currentIdx = OUTPUT_MODE_ORDER.indexOf(current);
  const capIdx = OUTPUT_MODE_ORDER.indexOf(capTo);
  // Lower index = stricter. Take the stricter of the two.
  return currentIdx <= capIdx ? current : capTo;
}
