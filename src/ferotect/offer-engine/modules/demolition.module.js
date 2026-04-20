import { MODULE_ID, EXISTING_MATERIAL } from '../contracts/enums.js';
import { createModuleResult } from '../contracts/outputSchema.js';
import pricingConfig from '../config/pricing.config.js';

/**
 * M_DEMO — Demolition module
 *
 * Calculates: cost of removing existing roof material per m²
 *
 * When existing_material = UNKNOWN:
 *   Uses WEIGHTED_DEFAULT rate (170 kr/m²) — weighted average of common materials.
 *
 * When existing_material = ETERNIT:
 *   Returns 0 — asbestos cases are handled outside engine in MVP.
 *
 * Customer sees: "Rivning och demontering"
 */
export default function computeDemolition({ area_m2, existing_material }) {
  const assumptions = [];

  // Eternit/asbestos — should have been caught as hard blocker before here,
  // but safeguard: return zero, flag it
  if (existing_material === EXISTING_MATERIAL.ETERNIT) {
    return createModuleResult(MODULE_ID.M_DEMO, {
      included: false,
      flags: ['ASBESTOS_DETECTED'],
      assumptions: ['Asbestos detected — demolition handled outside standard flow'],
    });
  }

  // Resolve demolition rate
  let rate;
  if (existing_material === EXISTING_MATERIAL.UNKNOWN) {
    rate = pricingConfig.demolition_rate.WEIGHTED_DEFAULT;
    assumptions.push(
      `Existing material unknown — using weighted default rate (${rate} kr/m²)`
    );
  } else {
    rate = pricingConfig.demolition_rate[existing_material];
    if (rate === undefined) {
      // Fallback for unexpected material values
      rate = pricingConfig.demolition_rate.WEIGHTED_DEFAULT;
      assumptions.push(
        `No rate for material "${existing_material}" — using weighted default (${rate} kr/m²)`
      );
    }
  }

  const cost = Math.round(area_m2 * rate);

  return createModuleResult(MODULE_ID.M_DEMO, {
    included: true,
    customer_visible: true,
    min: cost,
    max: cost,
    expected: cost,
    assumptions,
    _breakdown: {
      rate,
      area_m2,
    },
  });
}
