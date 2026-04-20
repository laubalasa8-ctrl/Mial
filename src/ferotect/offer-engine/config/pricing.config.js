import {
  DESIRED_MATERIAL,
  EXISTING_MATERIAL,
  MARGIN_PROFILE,
} from '../contracts/enums.js';

/**
 * Pricing configuration — source of truth for all price parameters.
 * All values in SEK. Updated quarterly from Ferotect's real spreadsheets.
 *
 * WARNING: These are initial defaults / placeholders.
 * They MUST be replaced with real values from Ferotect's kalkylark
 * before any customer-facing use.
 */
const pricingConfig = Object.freeze({

  // ── UNIT PRICES (material + work per m²) ──
  unit_price: Object.freeze({
    [DESIRED_MATERIAL.BETONG_STANDARD]: 1200,
    [DESIRED_MATERIAL.LERTEGEL]: 1550,
    [DESIRED_MATERIAL.PLAT_SF]: 1450,
    [DESIRED_MATERIAL.PLAT_LP]: 1100,
  }),

  // ── DEMOLITION RATES (per m²) ──
  demolition_rate: Object.freeze({
    [EXISTING_MATERIAL.BETONG]: 180,
    [EXISTING_MATERIAL.TEGEL]: 200,
    [EXISTING_MATERIAL.PLAT]: 150,
    [EXISTING_MATERIAL.PAPP]: 120,
    [EXISTING_MATERIAL.OTHER]: 180,
    WEIGHTED_DEFAULT: 170, // Weighted average, used when existing_material = UNKNOWN
  }),

  // ── SUBSTRATE COSTS (per m²) ──
  underlayer_cost_per_m2: 85,
  sub_structure_cost_per_m2: 420,

  // ── SCAFFOLD ──
  scaffold_price_per_lpm: 350,

  // ── ADDON PRICES ──
  gutter_price_per_lpm: 850,
  chimney_flashing_price: 12000, // Per chimney, fixed
  roof_window_replacement: 8500, // Per window, fixed
  snow_safety_per_lpm: 450,

  // ── PROJECT FLOOR ──
  minimum_project_floor: 95000,

  // ── MARGIN PROFILES (exclusive, priority order) ──
  margin_profiles: Object.freeze({
    [MARGIN_PROFILE.SMALL_PROJECT]: Object.freeze({
      rate: 0.28,
      area_threshold: 100, // area_m2 < this triggers profile
    }),
    [MARGIN_PROFILE.PREMIUM_MATERIAL]: Object.freeze({
      rate: 0.25,
      materials: Object.freeze([DESIRED_MATERIAL.LERTEGEL, DESIRED_MATERIAL.PLAT_SF]),
    }),
    [MARGIN_PROFILE.STANDARD]: Object.freeze({
      rate: 0.22,
    }),
  }),

  // ── LOGISTICS RATES (per postal zone) ──
  logistics_rate: Object.freeze({
    CORE: 0.00,
    MID: 0.04,
    OUTER: 0.08,
  }),
});

export default pricingConfig;
