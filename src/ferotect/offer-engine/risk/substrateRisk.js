import {
  ROOF_AGE_BAND,
  SYMPTOM,
  SUBSTRATE_RISK,
  SUBSTRATE_RISK_ORDER,
} from '../contracts/enums.js';
import { stepEnum, clampEnum } from '../utils/math.js';

/**
 * Substrate Risk Engine
 *
 * Determines the risk level for structural substrate (råspont) work
 * based on roof age and customer-reported symptoms.
 *
 * Model:
 *   1. Resolve base risk from age band
 *   2. Calculate symptom lift (max-logic, not additive)
 *   3. Clamp final risk to valid range
 *
 * @param {string} roofAgeBand - ROOF_AGE_BAND enum value
 * @param {string[]} symptomFlags - Array of SYMPTOM enum values
 * @returns {{ base_risk, symptom_lift, final_risk, details }}
 */
export default function computeSubstrateRisk(roofAgeBand, symptomFlags) {
  const baseRisk = resolveBaseRisk(roofAgeBand);
  const symptomLift = resolveSymptomLift(symptomFlags);
  const finalRisk = stepEnum(baseRisk, symptomLift, SUBSTRATE_RISK_ORDER);
  const clamped = clampEnum(
    finalRisk,
    SUBSTRATE_RISK_ORDER,
    SUBSTRATE_RISK.LOW,
    SUBSTRATE_RISK.HIGH
  );

  return {
    base_risk: baseRisk,
    symptom_lift: symptomLift,
    final_risk: clamped,
    details: {
      age_band: roofAgeBand,
      symptoms: symptomFlags,
    },
  };
}


// ── BASE RISK FROM AGE ──

const AGE_RISK_MAP = Object.freeze({
  [ROOF_AGE_BAND.LT_20]: SUBSTRATE_RISK.LOW,
  [ROOF_AGE_BAND.AGE_20_35]: SUBSTRATE_RISK.LOW,
  [ROOF_AGE_BAND.AGE_35_50]: SUBSTRATE_RISK.LOW_MED,
  [ROOF_AGE_BAND.GT_50]: SUBSTRATE_RISK.MED,
  [ROOF_AGE_BAND.UNKNOWN]: SUBSTRATE_RISK.LOW_MED,
});

function resolveBaseRisk(ageBand) {
  return AGE_RISK_MAP[ageBand] || SUBSTRATE_RISK.LOW_MED;
}


// ── SYMPTOM LIFT ──

// Each symptom → number of steps to lift the risk
const SYMPTOM_LIFT = Object.freeze({
  [SYMPTOM.LEAK]: 2,
  [SYMPTOM.MOISTURE_INSIDE]: 2,
  [SYMPTOM.BROKEN_TILES]: 0,
  [SYMPTOM.SAGGING_GUTTERS]: 0,
  [SYMPTOM.MOSS]: 0,
  [SYMPTOM.NONE]: 0,
  [SYMPTOM.UNKNOWN]: 1,
});

function resolveSymptomLift(symptomFlags) {
  if (!symptomFlags || symptomFlags.length === 0) {
    return SYMPTOM_LIFT[SYMPTOM.UNKNOWN];
  }

  // If NONE is explicitly stated, no lift regardless of other flags
  if (symptomFlags.includes(SYMPTOM.NONE)) {
    return 0;
  }

  // Max-logic: take the highest lift from all reported symptoms
  let maxLift = 0;
  for (const symptom of symptomFlags) {
    const lift = SYMPTOM_LIFT[symptom];
    if (lift !== undefined && lift > maxLift) {
      maxLift = lift;
    }
  }
  return maxLift;
}
