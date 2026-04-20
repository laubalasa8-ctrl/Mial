import {
  ROOF_TYPE,
  SUBSTRATE_RISK,
  SIZE_CLASS,
} from '../contracts/enums.js';

/**
 * Rules configuration — structural parameters and thresholds.
 * Separated from pricing to allow independent updates.
 */
const rulesConfig = Object.freeze({

  // ── SLOPE FACTORS (roof type → factor for footprint-to-roof-area conversion) ──
  slope_factor: Object.freeze({
    [ROOF_TYPE.SAD]: 1.20,
    [ROOF_TYPE.PUL]: 1.10,
    [ROOF_TYPE.VAL]: 1.35,
    [ROOF_TYPE.KOM]: 1.45,
    [ROOF_TYPE.UNK]: 1.25,
    [ROOF_TYPE.PLA]: 1.00,
  }),

  // ── COMPLEXITY FACTORS (multiplied against base price) ──
  complexity_factor: Object.freeze({
    [ROOF_TYPE.SAD]: 1.00,
    [ROOF_TYPE.PUL]: 0.95,
    [ROOF_TYPE.VAL]: 1.30,
    [ROOF_TYPE.KOM]: 1.70,
    [ROOF_TYPE.UNK]: 1.20,
    [ROOF_TYPE.PLA]: 0.80,
  }),

  // ── CONFIDENCE DOMAIN WEIGHTS ──
  confidence_weights: Object.freeze({
    geometry: 0.40,
    material: 0.15,
    condition: 0.30,
    addon: 0.15,
  }),

  // ── UNKNOWN BURDEN THRESHOLDS ──
  // unknown_burden value → confidence penalty multiplier
  // Tighter thresholds: even a single major unknown (weight 2.0) triggers a penalty.
  unknown_burden_thresholds: Object.freeze([
    { max: 1.5, penalty: 1.0 },
    { max: 3.0, penalty: 0.90 },
    { max: 5.0, penalty: 0.78 },
    { max: 7.0, penalty: 0.62 },
    { max: Infinity, penalty: 0.50 },
  ]),

  // ── UNKNOWN BURDEN WEIGHTS (per field) ──
  unknown_burden_weights: Object.freeze({
    roof_type: 3.0,        // CRITICAL
    area_fallback: 3.0,    // CRITICAL (area_method = FALLBACK)
    area_size_class: 2.0,  // MAJOR (area_method = SIZE_CLASS)
    existing_material: 1.5, // MAJOR — drives demolition cost, asbestos risk, substrate correlation
    roof_age_band: 2.0,    // MAJOR
    symptom_flags: 1.5,    // MAJOR
    floors: 0.5,           // MINOR
    property_access: 0.5,  // MINOR
    addon_gutters: 0.5,    // MINOR
    addon_chimney: 0.5,    // MINOR
    addon_roof_windows: 0.5, // MINOR
    addon_snow_safety: 0.5,  // MINOR
  }),

  // ── SPAN THRESHOLDS (for output mode determination) ──
  span_thresholds: Object.freeze({
    full_interval_max: 0.30,
    qualified_interval_max: 0.40,
    price_level_max: 0.50,
  }),

  // ── CONFIDENCE CLASS THRESHOLDS ──
  confidence_class_thresholds: Object.freeze({
    high: 70,
    medium: 45,
    low: 25,
    // Below 25 = INSUFFICIENT
  }),

  // ── OUTPUT MODE CONFIDENCE THRESHOLDS ──
  output_mode_confidence: Object.freeze({
    full_interval_min: 65,
    qualified_interval_min: 45,
    price_level_min: 25,
    // Below 25 = NO_PRICE_CONTACT_REQUIRED
  }),

  // ── SUBSTRATE RISK: PROBABILITY & COVERAGE ──
  substrate_probability: Object.freeze({
    [SUBSTRATE_RISK.LOW]: Object.freeze({
      coverage_min: 0.00, coverage_max: 0.10, probability: 0.10,
    }),
    [SUBSTRATE_RISK.LOW_MED]: Object.freeze({
      coverage_min: 0.00, coverage_max: 0.20, probability: 0.25,
    }),
    [SUBSTRATE_RISK.MED]: Object.freeze({
      coverage_min: 0.05, coverage_max: 0.40, probability: 0.45,
    }),
    [SUBSTRATE_RISK.MED_HIGH]: Object.freeze({
      coverage_min: 0.10, coverage_max: 0.60, probability: 0.60,
    }),
    [SUBSTRATE_RISK.HIGH]: Object.freeze({
      coverage_min: 0.20, coverage_max: 1.00, probability: 0.80,
    }),
  }),

  // ── INTERNAL TARGET PRICE: MEDIAN COVERAGE PER RISK ──
  median_coverage: Object.freeze({
    [SUBSTRATE_RISK.LOW]: 0.05,
    [SUBSTRATE_RISK.LOW_MED]: 0.10,
    [SUBSTRATE_RISK.MED]: 0.22,
    [SUBSTRATE_RISK.MED_HIGH]: 0.35,
    [SUBSTRATE_RISK.HIGH]: 0.60,
  }),

  // ── SCAFFOLD ASSUMPTIONS ──
  scaffold_assumptions: Object.freeze({
    unknown_floors_requires_scaffold: true,
    min_floors_requiring_scaffold: '1.5',
  }),

  // ── SIZE CLASS DEFINITIONS ──
  size_class_definitions: Object.freeze({
    [SIZE_CLASS.SMALL]: Object.freeze({ median: 100, min: 80, max: 120 }),
    [SIZE_CLASS.MEDIUM]: Object.freeze({ median: 150, min: 120, max: 180 }),
    [SIZE_CLASS.LARGE]: Object.freeze({ median: 200, min: 170, max: 240 }),
    [SIZE_CLASS.XLARGE]: Object.freeze({ median: 260, min: 220, max: 310 }),
  }),

  // ── AREA VALIDATION ──
  area_validation: Object.freeze({
    absolute_min: 40,
    absolute_max: 500,
    footprint_min: 60,
    footprint_max: 250,
    large_project_threshold: 400,
  }),

  // ── DEFAULT GUTTER LPM FORM FACTORS ──
  gutter_lpm_form_factor: Object.freeze({
    [ROOF_TYPE.SAD]: 2.0,
    [ROOF_TYPE.PUL]: 1.8,
    [ROOF_TYPE.VAL]: 2.4,
    [ROOF_TYPE.UNK]: 2.1,
  }),

  // ── DOMINANT SUBSTRATE CAP THRESHOLD ──
  dominant_substrate_threshold: 0.35,
});

export default rulesConfig;
