import {
  ROOF_TYPE,
  DESIRED_MATERIAL,
  EXISTING_MATERIAL,
  AREA_METHOD,
  SIZE_CLASS,
  ROOF_AGE_BAND,
  FLOORS,
  PROPERTY_ACCESS,
  SYMPTOM,
  ADDON_ANSWER,
  LEAD_TIMELINE,
  OWNERSHIP_STATUS,
  CONFIDENCE_FLAG,
} from './enums.js';

/**
 * Input schema definition.
 * Defines every field the offer engine accepts after normalization.
 *
 * Contract statuses:
 *   required_for_calculation — engine cannot run without this populated
 *   required_from_user       — user must provide (no system default allowed)
 *   fallback_allowed         — system may default/infer when user doesn't answer
 */

const inputFields = Object.freeze({

  // ── HARD BLOCKERS (engine refuses to run without these) ──

  roof_type: Object.freeze({
    datatype: 'enum',
    allowed: Object.values(ROOF_TYPE),
    required_for_calculation: true,
    required_from_user: true, // UNK is an explicit user choice, not a default
    fallback_allowed: false,
    description: 'Taktyp. UNK allowed as explicit user selection.',
  }),

  desired_material: Object.freeze({
    datatype: 'enum',
    allowed: Object.values(DESIRED_MATERIAL),
    required_for_calculation: true,
    required_from_user: true,
    fallback_allowed: false,
    description: 'Önskat nytt takmaterial.',
  }),

  postal_code: Object.freeze({
    datatype: 'string',
    format: /^\d{3}\s?\d{2}$/,
    required_for_calculation: true,
    required_from_user: true,
    fallback_allowed: false,
    description: 'Postnummer, 5 siffror. Hård blockerare.',
  }),

  // area_m2 is required_for_calculation but NOT required_from_user
  // (area engine can derive it from footprint or size class)
  area_m2: Object.freeze({
    datatype: 'float',
    min: 40,
    max: 500,
    required_for_calculation: true,
    required_from_user: false,
    fallback_allowed: true,
    fallback_strategy: 'Derived by area engine from footprint_m2, size_class, or fallback.',
    description: 'Takyta i m². Always populated after normalization via area engine.',
  }),

  // ── NON-BLOCKING FIELDS (improve precision, have fallbacks) ──

  area_method: Object.freeze({
    datatype: 'enum',
    allowed: Object.values(AREA_METHOD),
    required_for_calculation: true,
    required_from_user: false,
    fallback_allowed: true,
    fallback_strategy: 'Set by area engine based on available inputs.',
    description: 'How area was determined. System-derived.',
  }),

  area_raw_input: Object.freeze({
    datatype: 'object',
    required_for_calculation: false,
    required_from_user: false,
    fallback_allowed: true,
    description: 'Raw area input from user. Stored for traceability.',
  }),

  existing_material: Object.freeze({
    datatype: 'enum',
    allowed: Object.values(EXISTING_MATERIAL),
    required_for_calculation: true,
    required_from_user: false,
    fallback_allowed: true,
    fallback_value: EXISTING_MATERIAL.UNKNOWN,
    description: 'Befintligt takmaterial. UNKNOWN uses WEIGHTED_DEFAULT demolition rate.',
  }),

  roof_age_band: Object.freeze({
    datatype: 'enum',
    allowed: Object.values(ROOF_AGE_BAND),
    required_for_calculation: false,
    required_from_user: false,
    fallback_allowed: true,
    fallback_value: ROOF_AGE_BAND.UNKNOWN,
    description: 'Ungefärlig ålder. Styr substrate risk.',
  }),

  floors: Object.freeze({
    datatype: 'enum',
    allowed: Object.values(FLOORS),
    required_for_calculation: false,
    required_from_user: false,
    fallback_allowed: true,
    fallback_value: FLOORS.UNKNOWN,
    description: 'Antal våningar. UNKNOWN → scaffold assumed conservatively.',
  }),

  property_access: Object.freeze({
    datatype: 'enum',
    allowed: Object.values(PROPERTY_ACCESS),
    required_for_calculation: false,
    required_from_user: false,
    fallback_allowed: true,
    fallback_value: PROPERTY_ACCESS.MODERATE,
    description: 'Tillgänglighet till taket.',
  }),

  symptom_flags: Object.freeze({
    datatype: 'array<enum>',
    allowed: Object.values(SYMPTOM),
    required_for_calculation: false,
    required_from_user: false,
    fallback_allowed: true,
    fallback_value: [SYMPTOM.UNKNOWN],
    description: 'Kundobserverade symptom. Styr substrate risk.',
  }),

  // ── ADDONS ──

  addon_gutters: Object.freeze({
    datatype: 'enum',
    allowed: Object.values(ADDON_ANSWER),
    required_for_calculation: false,
    required_from_user: false,
    fallback_allowed: true,
    fallback_value: ADDON_ANSWER.UNKNOWN,
    description: 'Hängrännor + stuprör.',
  }),

  addon_chimney: Object.freeze({
    datatype: 'object',
    required_for_calculation: false,
    required_from_user: false,
    fallback_allowed: true,
    fallback_value: { action: ADDON_ANSWER.UNKNOWN, count: 0 },
    description: 'Skorstensbeslagning. { action: YES/NO/UNKNOWN, count: int }. Also accepts plain string for backward compat.',
  }),

  addon_roof_windows: Object.freeze({
    datatype: 'object',
    required_for_calculation: false,
    required_from_user: false,
    fallback_allowed: true,
    fallback_value: { action: ADDON_ANSWER.UNKNOWN, count: 0 },
    description: 'Takfönster byte. { action: YES/NO/UNKNOWN, count: int }',
  }),

  addon_snow_safety: Object.freeze({
    datatype: 'enum',
    allowed: Object.values(ADDON_ANSWER),
    required_for_calculation: false,
    required_from_user: false,
    fallback_allowed: true,
    fallback_value: ADDON_ANSWER.UNKNOWN,
    description: 'Snörasskydd.',
  }),

  // ── QUALIFICATION / LEAD SCORING ──

  lead_timeline: Object.freeze({
    datatype: 'enum',
    allowed: Object.values(LEAD_TIMELINE),
    required_for_calculation: false,
    required_from_user: false,
    fallback_allowed: true,
    fallback_value: LEAD_TIMELINE.UNKNOWN,
    description: 'Önskad tidsram.',
  }),

  ownership_status: Object.freeze({
    datatype: 'enum',
    allowed: Object.values(OWNERSHIP_STATUS),
    required_for_calculation: false,
    required_from_user: false,
    fallback_allowed: true,
    fallback_value: OWNERSHIP_STATUS.UNKNOWN,
    description: 'Ägar-/beslutsfattarstatus.',
  }),
});

/**
 * List of hard blockers — fields where missing data prevents engine execution.
 */
export const HARD_BLOCKERS = Object.freeze(
  Object.entries(inputFields)
    .filter(([, def]) => def.required_for_calculation && !def.fallback_allowed)
    .map(([key]) => key)
);

/**
 * Validate that all hard blockers are present in normalized input.
 * Returns array of missing field names (empty = all good).
 */
export function validateHardBlockers(normalizedInput) {
  const missing = [];
  for (const field of HARD_BLOCKERS) {
    const value = normalizedInput[field];
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    }
  }
  return missing;
}

export default inputFields;
