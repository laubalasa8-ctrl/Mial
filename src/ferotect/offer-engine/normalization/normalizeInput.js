import {
  ROOF_TYPE,
  DESIRED_MATERIAL,
  EXISTING_MATERIAL,
  ROOF_AGE_BAND,
  FLOORS,
  PROPERTY_ACCESS,
  SYMPTOM,
  ADDON_ANSWER,
  LEAD_TIMELINE,
  OWNERSHIP_STATUS,
  CONFIDENCE_FLAG,
} from '../contracts/enums.js';

/**
 * Normalize raw user input into the internal engine contract.
 *
 * - Maps raw values to canonical enums
 * - Applies fallback defaults where allowed
 * - Throws on missing hard blockers
 * - Sets confidence_flag per field
 * - Detects asbestos flag
 * - Applies SAGGING_GUTTERS → addon_gutters inference
 *
 * @param {object} rawInput - Raw input from frontend/API
 * @returns {{ normalized: object, confidence_flags: object, warnings: string[] }}
 */
export default function normalizeInput(rawInput) {
  const warnings = [];
  const confidence_flags = {};
  const normalized = {};

  // ── ROOF TYPE ──
  normalized.roof_type = resolveEnum(
    rawInput.roof_type,
    Object.values(ROOF_TYPE),
    null // no fallback — hard blocker
  );
  confidence_flags.roof_type =
    normalized.roof_type === ROOF_TYPE.UNK
      ? CONFIDENCE_FLAG.UNKNOWN
      : normalized.roof_type
        ? CONFIDENCE_FLAG.VERIFIED
        : null;

  // ── DESIRED MATERIAL ──
  normalized.desired_material = resolveEnum(
    rawInput.desired_material,
    Object.values(DESIRED_MATERIAL),
    null // no fallback — hard blocker
  );
  confidence_flags.desired_material = normalized.desired_material
    ? CONFIDENCE_FLAG.VERIFIED
    : null;

  // ── POSTAL CODE ──
  normalized.postal_code = normalizePostalCode(rawInput.postal_code);
  confidence_flags.postal_code = normalized.postal_code
    ? CONFIDENCE_FLAG.VERIFIED
    : null;

  // ── AREA RAW INPUT (passed through to area engine) ──
  normalized.area_raw_input = rawInput.area_raw_input || null;

  // area_m2 and area_method are set by area engine, not normalization
  normalized.area_m2 = null;
  normalized.area_method = null;

  // ── EXISTING MATERIAL ──
  normalized.existing_material = resolveEnum(
    rawInput.existing_material,
    Object.values(EXISTING_MATERIAL),
    EXISTING_MATERIAL.UNKNOWN
  );
  confidence_flags.existing_material =
    rawInput.existing_material && normalized.existing_material !== EXISTING_MATERIAL.UNKNOWN
      ? CONFIDENCE_FLAG.VERIFIED
      : CONFIDENCE_FLAG.UNKNOWN;

  // ── ASBESTOS FLAG ──
  normalized.asbestos_flag =
    normalized.existing_material === EXISTING_MATERIAL.ETERNIT;

  // ── ROOF AGE BAND ──
  normalized.roof_age_band = resolveEnum(
    rawInput.roof_age_band,
    Object.values(ROOF_AGE_BAND),
    ROOF_AGE_BAND.UNKNOWN
  );
  confidence_flags.roof_age_band =
    normalized.roof_age_band !== ROOF_AGE_BAND.UNKNOWN
      ? CONFIDENCE_FLAG.VERIFIED
      : CONFIDENCE_FLAG.UNKNOWN;

  // ── FLOORS ──
  normalized.floors = resolveEnum(
    rawInput.floors,
    Object.values(FLOORS),
    FLOORS.UNKNOWN
  );
  confidence_flags.floors =
    normalized.floors !== FLOORS.UNKNOWN
      ? CONFIDENCE_FLAG.VERIFIED
      : CONFIDENCE_FLAG.UNKNOWN;

  // ── PROPERTY ACCESS ──
  normalized.property_access = resolveEnum(
    rawInput.property_access,
    Object.values(PROPERTY_ACCESS),
    PROPERTY_ACCESS.MODERATE
  );
  confidence_flags.property_access =
    rawInput.property_access
      ? CONFIDENCE_FLAG.VERIFIED
      : CONFIDENCE_FLAG.INFERRED;

  // ── SYMPTOM FLAGS ──
  normalized.symptom_flags = normalizeSymptoms(rawInput.symptom_flags);
  confidence_flags.symptom_flags =
    normalized.symptom_flags.includes(SYMPTOM.UNKNOWN)
      ? CONFIDENCE_FLAG.UNKNOWN
      : CONFIDENCE_FLAG.VERIFIED;

  // ── ADDONS ──
  normalized.addon_gutters = resolveEnum(
    rawInput.addon_gutters,
    Object.values(ADDON_ANSWER),
    ADDON_ANSWER.UNKNOWN
  );

  // SAGGING_GUTTERS side-effect: infer addon_gutters = YES
  if (
    normalized.symptom_flags.includes(SYMPTOM.SAGGING_GUTTERS) &&
    normalized.addon_gutters === ADDON_ANSWER.UNKNOWN
  ) {
    normalized.addon_gutters = ADDON_ANSWER.YES;
    confidence_flags.addon_gutters = CONFIDENCE_FLAG.INFERRED;
    warnings.push('addon_gutters inferred YES from SAGGING_GUTTERS symptom');
  } else {
    confidence_flags.addon_gutters =
      normalized.addon_gutters !== ADDON_ANSWER.UNKNOWN
        ? CONFIDENCE_FLAG.VERIFIED
        : CONFIDENCE_FLAG.UNKNOWN;
  }

  normalized.addon_chimney = normalizeChimney(rawInput.addon_chimney);
  confidence_flags.addon_chimney =
    normalized.addon_chimney.action !== ADDON_ANSWER.UNKNOWN
      ? CONFIDENCE_FLAG.VERIFIED
      : CONFIDENCE_FLAG.UNKNOWN;

  normalized.addon_roof_windows = normalizeRoofWindows(rawInput.addon_roof_windows);
  confidence_flags.addon_roof_windows =
    normalized.addon_roof_windows.action !== ADDON_ANSWER.UNKNOWN
      ? CONFIDENCE_FLAG.VERIFIED
      : CONFIDENCE_FLAG.UNKNOWN;

  normalized.addon_snow_safety = resolveEnum(
    rawInput.addon_snow_safety,
    Object.values(ADDON_ANSWER),
    ADDON_ANSWER.UNKNOWN
  );
  confidence_flags.addon_snow_safety =
    normalized.addon_snow_safety !== ADDON_ANSWER.UNKNOWN
      ? CONFIDENCE_FLAG.VERIFIED
      : CONFIDENCE_FLAG.UNKNOWN;

  // ── QUALIFICATION ──
  normalized.lead_timeline = resolveEnum(
    rawInput.lead_timeline,
    Object.values(LEAD_TIMELINE),
    LEAD_TIMELINE.UNKNOWN
  );
  normalized.ownership_status = resolveEnum(
    rawInput.ownership_status,
    Object.values(OWNERSHIP_STATUS),
    OWNERSHIP_STATUS.UNKNOWN
  );

  // ── VALIDATE HARD BLOCKERS ──
  const missingBlockers = [];
  if (!normalized.roof_type) missingBlockers.push('roof_type');
  if (!normalized.desired_material) missingBlockers.push('desired_material');
  if (!normalized.postal_code) missingBlockers.push('postal_code');
  // area_m2 is validated after area engine runs, not here

  if (missingBlockers.length > 0) {
    throw new Error(
      `Hard blocker(s) missing: ${missingBlockers.join(', ')}. Engine cannot run.`
    );
  }

  return { normalized, confidence_flags, warnings };
}


// ── HELPERS ──

/**
 * Alias maps for common user-facing / frontend variations.
 * Keys are UPPERCASE. Values are the canonical enum value.
 * Only populated for fields where aliasing is realistic.
 */
const ENUM_ALIASES = Object.freeze({
  // Roof types
  SADELTAK: ROOF_TYPE.SAD,
  SADEL: ROOF_TYPE.SAD,
  VALMAT: ROOF_TYPE.VAL,
  VALMAD: ROOF_TYPE.VAL,
  PULPET: ROOF_TYPE.PUL,
  PULPETTAK: ROOF_TYPE.PUL,
  KOMBINERAT: ROOF_TYPE.KOM,
  PLATT: ROOF_TYPE.PLA,
  PLATTTAK: ROOF_TYPE.PLA,
  UNKNOWN: ROOF_TYPE.UNK,
  OKAND: ROOF_TYPE.UNK,
  OKÄND: ROOF_TYPE.UNK,

  // Desired materials
  BETONG: DESIRED_MATERIAL.BETONG_STANDARD,
  BETONGPANNOR: DESIRED_MATERIAL.BETONG_STANDARD,
  LERTEGEL: DESIRED_MATERIAL.LERTEGEL,
  TEGEL: DESIRED_MATERIAL.LERTEGEL,
  PLAT: DESIRED_MATERIAL.PLAT_LP,
  PLÅT: DESIRED_MATERIAL.PLAT_LP,
  SKIVPLAT: DESIRED_MATERIAL.PLAT_SF,
  SKIVPLÅT: DESIRED_MATERIAL.PLAT_SF,
  FALSAD: DESIRED_MATERIAL.PLAT_SF,
  LATTPROFILERAD: DESIRED_MATERIAL.PLAT_LP,
  LÄTTPROFILERAD: DESIRED_MATERIAL.PLAT_LP,

  // Existing materials
  PAPP: EXISTING_MATERIAL.PAPP,
  ETERNIT: EXISTING_MATERIAL.ETERNIT,

  // Addon answers
  YES: ADDON_ANSWER.YES,
  JA: ADDON_ANSWER.YES,
  NO: ADDON_ANSWER.NO,
  NEJ: ADDON_ANSWER.NO,

  // Floors
  '1': FLOORS.ONE,
  '1.5': FLOORS.ONE_HALF,
  '2': FLOORS.TWO,
});

/**
 * Resolve a raw value to a canonical enum.
 *
 * Strategy (in order):
 *   1. Exact match against allowedValues
 *   2. Case-insensitive match (uppercase)
 *   3. Alias lookup
 *   4. Fallback
 */
function resolveEnum(value, allowedValues, fallback) {
  if (value == null || value === '') return fallback;

  const str = String(value);

  // 1. Exact match
  if (allowedValues.includes(str)) return str;

  // 2. Case-insensitive
  const upper = str.toUpperCase().trim();
  const caseMatch = allowedValues.find((v) => v.toUpperCase() === upper);
  if (caseMatch) return caseMatch;

  // 3. Alias lookup
  const aliased = ENUM_ALIASES[upper];
  if (aliased && allowedValues.includes(aliased)) return aliased;

  return fallback;
}

function normalizePostalCode(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/\s/g, '');
  if (/^\d{5}$/.test(cleaned)) return cleaned;
  return null;
}

/**
 * Symptom alias map for tolerant resolution.
 * Keys are UPPERCASE. Values are canonical SYMPTOM enum values.
 */
const SYMPTOM_ALIASES = Object.freeze({
  LÄCKAGE: SYMPTOM.LEAK,
  LACKA: SYMPTOM.LEAK,
  LÄCKER: SYMPTOM.LEAK,
  FUKT: SYMPTOM.MOISTURE_INSIDE,
  FUKTIG: SYMPTOM.MOISTURE_INSIDE,
  TRASIGA_PANNOR: SYMPTOM.BROKEN_TILES,
  TRASIG: SYMPTOM.BROKEN_TILES,
  HÄNGANDE_RÄNNOR: SYMPTOM.SAGGING_GUTTERS,
  MOSSA: SYMPTOM.MOSS,
  INGA: SYMPTOM.NONE,
  INGET: SYMPTOM.NONE,
});

/**
 * Normalize symptom flags.
 *
 * Rules:
 *   1. Resolve each value via enum match / case-insensitive / alias
 *   2. Deduplicate
 *   3. If concrete symptoms exist → remove NONE and UNKNOWN (concrete wins)
 *   4. If no concrete symptoms but NONE exists → keep only NONE
 *   5. If nothing valid → [UNKNOWN]
 */
function normalizeSymptoms(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return [SYMPTOM.UNKNOWN];
  }

  const symptomValues = Object.values(SYMPTOM);
  const resolved = new Set();

  for (const item of raw) {
    if (item == null || item === '') continue;
    const str = String(item);

    // 1. Exact match
    if (symptomValues.includes(str)) {
      resolved.add(str);
      continue;
    }

    // 2. Case-insensitive
    const upper = str.toUpperCase().trim();
    const caseMatch = symptomValues.find((v) => v.toUpperCase() === upper);
    if (caseMatch) {
      resolved.add(caseMatch);
      continue;
    }

    // 3. Alias
    const aliased = SYMPTOM_ALIASES[upper];
    if (aliased) {
      resolved.add(aliased);
    }
    // Unrecognized values are silently dropped
  }

  if (resolved.size === 0) {
    return [SYMPTOM.UNKNOWN];
  }

  // Concrete = anything that isn't NONE or UNKNOWN
  const concrete = [...resolved].filter(
    (s) => s !== SYMPTOM.NONE && s !== SYMPTOM.UNKNOWN
  );

  if (concrete.length > 0) {
    // Concrete symptoms win — discard NONE and UNKNOWN
    return concrete;
  }

  // No concrete symptoms
  if (resolved.has(SYMPTOM.NONE)) {
    return [SYMPTOM.NONE];
  }

  return [SYMPTOM.UNKNOWN];
}

function normalizeRoofWindows(raw) {
  if (!raw || typeof raw !== 'object') {
    return { action: ADDON_ANSWER.UNKNOWN, count: 0 };
  }
  const action = resolveEnum(
    raw.action,
    Object.values(ADDON_ANSWER),
    ADDON_ANSWER.UNKNOWN
  );
  const count =
    action === ADDON_ANSWER.YES && typeof raw.count === 'number' && raw.count > 0
      ? Math.floor(raw.count)
      : 0;
  return { action, count };
}

/**
 * Normalize chimney addon input.
 * Accepts both string ("YES") and object ({action:"YES", count:2}) for backward compat.
 * Default count = 1 when YES and no count provided.
 */
function normalizeChimney(raw) {
  if (raw == null) return { action: ADDON_ANSWER.UNKNOWN, count: 0 };

  // String input (backward compatible)
  if (typeof raw === 'string') {
    const action = resolveEnum(raw, Object.values(ADDON_ANSWER), ADDON_ANSWER.UNKNOWN);
    return { action, count: action === ADDON_ANSWER.YES ? 1 : 0 };
  }

  // Object input {action, count}
  if (typeof raw === 'object') {
    const action = resolveEnum(
      raw.action,
      Object.values(ADDON_ANSWER),
      ADDON_ANSWER.UNKNOWN
    );
    const count =
      action === ADDON_ANSWER.YES && typeof raw.count === 'number' && raw.count > 0
        ? Math.floor(raw.count)
        : (action === ADDON_ANSWER.YES ? 1 : 0);
    return { action, count };
  }

  return { action: ADDON_ANSWER.UNKNOWN, count: 0 };
}
