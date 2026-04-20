import { AREA_METHOD, ROOF_TYPE, CONFIDENCE_FLAG } from '../contracts/enums.js';
import rulesConfig from '../config/rules.config.js';
import { clamp } from '../utils/math.js';

/**
 * Area Engine
 *
 * Determines takyta (roof area in m²) from available inputs.
 * Priority order:
 *   1. EXACT — user provides roof area directly
 *   2. FOOTPRINT_CALC — user provides footprint + roof_type → multiplied by slope factor
 *   3. SIZE_CLASS — user picks a size bucket
 *   4. FALLBACK — no usable input → default 150m² median
 *
 * @param {object} params
 * @param {object} params.area_raw_input - Raw area input from user
 * @param {string} params.roof_type - Normalized roof type enum
 * @returns {{ area_m2, area_method, slope_factor, geometry_confidence_base, uncertainty_pct, warnings }}
 */
export default function runAreaEngine({ area_raw_input, roof_type }) {
  const warnings = [];
  const raw = area_raw_input || {};
  const slopeFactor = rulesConfig.slope_factor[roof_type] || rulesConfig.slope_factor[ROOF_TYPE.UNK];

  // ── PATH 1: EXACT ──
  if (raw.exact_m2 != null && typeof raw.exact_m2 === 'number') {
    const area = raw.exact_m2;
    const validated = validateArea(area, warnings);

    return {
      area_m2: validated,
      area_method: AREA_METHOD.EXACT,
      slope_factor: slopeFactor,
      geometry_confidence_base: computeGeometryConfidence(AREA_METHOD.EXACT, roof_type),
      uncertainty_pct: 0.0,
      warnings,
    };
  }

  // ── PATH 2: FOOTPRINT_CALC ──
  if (raw.footprint_m2 != null && typeof raw.footprint_m2 === 'number') {
    const fp = raw.footprint_m2;
    const validation = rulesConfig.area_validation;

    if (fp < validation.footprint_min) {
      warnings.push(`Footprint ${fp} m² is below ${validation.footprint_min} m² — unusually small.`);
    }
    if (fp > validation.footprint_max) {
      warnings.push(`Footprint ${fp} m² is above ${validation.footprint_max} m² — unusually large.`);
    }

    const area = fp * slopeFactor;
    const validated = validateArea(area, warnings);

    return {
      area_m2: validated,
      area_method: AREA_METHOD.FOOTPRINT_CALC,
      slope_factor: slopeFactor,
      geometry_confidence_base: computeGeometryConfidence(AREA_METHOD.FOOTPRINT_CALC, roof_type),
      uncertainty_pct: 0.10,
      warnings,
    };
  }

  // ── PATH 3: SIZE_CLASS ──
  if (raw.size_class != null) {
    const classDef = rulesConfig.size_class_definitions[raw.size_class];
    if (!classDef) {
      warnings.push(`Unknown size_class: ${raw.size_class}. Falling back to MEDIUM.`);
      return runAreaEngine({
        area_raw_input: { size_class: 'MEDIUM' },
        roof_type,
      });
    }

    const area = classDef.median * slopeFactor;
    const classRange = (classDef.max - classDef.min) / classDef.median;
    const uncertaintyPct = Math.max(0.18, classRange * 0.5);

    return {
      area_m2: Math.round(area),
      area_method: AREA_METHOD.SIZE_CLASS,
      slope_factor: slopeFactor,
      geometry_confidence_base: computeGeometryConfidence(AREA_METHOD.SIZE_CLASS, roof_type),
      uncertainty_pct: uncertaintyPct,
      warnings,
    };
  }

  // ── PATH 4: FALLBACK ──
  warnings.push('No area input provided. Using fallback (150 m² median villa × slope factor).');
  const fallbackArea = Math.round(150 * slopeFactor);

  return {
    area_m2: fallbackArea,
    area_method: AREA_METHOD.FALLBACK,
    slope_factor: slopeFactor,
    geometry_confidence_base: computeGeometryConfidence(AREA_METHOD.FALLBACK, roof_type),
    uncertainty_pct: 0.25,
    warnings,
  };
}


// ── HELPERS ──

function validateArea(area, warnings) {
  const { absolute_min, absolute_max, large_project_threshold } = rulesConfig.area_validation;

  if (area < absolute_min) {
    warnings.push(`Area ${area} m² is below minimum ${absolute_min} m². Clamped.`);
  }
  if (area > absolute_max) {
    warnings.push(`Area ${area} m² exceeds maximum ${absolute_max} m². Clamped.`);
  }
  if (area > large_project_threshold) {
    warnings.push(`Area ${area} m² exceeds ${large_project_threshold} m² — possible large/commercial project.`);
  }

  return Math.round(clamp(area, absolute_min, absolute_max));
}

/**
 * Compute base geometry confidence (0.0–1.0).
 * Based on area method and whether roof type is known.
 */
function computeGeometryConfidence(areaMethod, roofType) {
  const roofKnown = roofType !== ROOF_TYPE.UNK;

  switch (areaMethod) {
    case AREA_METHOD.EXACT:
      return 1.0;
    case AREA_METHOD.FOOTPRINT_CALC:
      return roofKnown ? 0.7 : 0.5;
    case AREA_METHOD.SIZE_CLASS:
      return roofKnown ? 0.4 : 0.2;
    case AREA_METHOD.FALLBACK:
      return 0.1;
    default:
      return 0.1;
  }
}
