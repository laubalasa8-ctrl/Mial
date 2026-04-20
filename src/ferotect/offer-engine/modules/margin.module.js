import {
  MODULE_ID,
  MARGIN_PROFILE,
  DESIRED_MATERIAL,
  FLOOR_REASON,
} from '../contracts/enums.js';
import { createModuleResult } from '../contracts/outputSchema.js';
import pricingConfig from '../config/pricing.config.js';

/**
 * M_MARGIN — Internal margin module
 *
 * Selects margin profile (exclusive, priority order):
 *   1. SMALL_PROJECT if area_m2 < threshold (100)
 *   2. PREMIUM_MATERIAL if desired_material in premium list
 *   3. STANDARD otherwise
 *
 * Also applies minimum project floor.
 *
 * NEVER customer-visible. Margin is embedded proportionally in customer-facing line items.
 *
 * @param {object} params
 * @param {number} params.area_m2
 * @param {string} params.desired_material
 * @param {number} params.subtotal_min - Sum of all other modules (min)
 * @param {number} params.subtotal_max - Sum of all other modules (max)
 * @param {number} params.subtotal_expected - Sum of all other modules (expected)
 * @returns {object} Module result with margin details + floor info
 */
export default function computeMargin({
  area_m2,
  desired_material,
  subtotal_min,
  subtotal_max,
  subtotal_expected,
}) {
  const { profile_key, rate, selection_reason } = selectProfile(area_m2, desired_material);

  // Step 1: Apply margin to each subtotal tier
  const marginMin = Math.round(subtotal_min * rate);
  const marginMax = Math.round(subtotal_max * rate);
  const marginExpected = Math.round(subtotal_expected * rate);

  const totalMin = subtotal_min + marginMin;
  const totalMax = subtotal_max + marginMax;
  const totalExpected = subtotal_expected + marginExpected;

  // Step 2: Floor protection — lifts min if below minimum project floor.
  // Only affects min; expected and max are handled by the invariant below.
  const floor = applyFloor(totalMin, totalExpected, area_m2);

  // Step 3: Enforce min <= expected <= max.
  // If floor pushed min above expected (or even above max), the invariant
  // cascades: expected is clamped up to min, max is clamped up to expected.
  // This is the single source of truth for final totals.
  const effectiveMin = floor.applied ? floor.adjusted_min : totalMin;
  const totals = enforceTotalInvariant(effectiveMin, totalExpected, totalMax);

  // Step 4: Record what the invariant actually moved (for auditing)
  floor.expected_lifted = totals.expected > totalExpected;
  floor.max_lifted = totals.max > totalMax;

  return createModuleResult(MODULE_ID.M_MARGIN, {
    included: true,
    customer_visible: false, // NEVER shown to customer
    min: marginMin,
    max: marginMax,
    expected: marginExpected,
    assumptions: [
      `Profile: ${profile_key} (rate: ${(rate * 100).toFixed(0)}%)`,
      selection_reason,
    ],
    _profile: {
      profile_key,
      rate,
      selection_reason,
    },
    _floor: floor,
    _totals_after_margin: totals,
  });
}


// ── PROFILE SELECTION (exclusive, priority order) ──

function selectProfile(area_m2, desired_material) {
  const profiles = pricingConfig.margin_profiles;

  // Priority 1: Small project
  const smallProfile = profiles[MARGIN_PROFILE.SMALL_PROJECT];
  if (area_m2 < smallProfile.area_threshold) {
    return {
      profile_key: MARGIN_PROFILE.SMALL_PROJECT,
      rate: smallProfile.rate,
      selection_reason: `area_m2 = ${area_m2}, below ${smallProfile.area_threshold} m² threshold`,
    };
  }

  // Priority 2: Premium material
  const premiumProfile = profiles[MARGIN_PROFILE.PREMIUM_MATERIAL];
  if (premiumProfile.materials.includes(desired_material)) {
    return {
      profile_key: MARGIN_PROFILE.PREMIUM_MATERIAL,
      rate: premiumProfile.rate,
      selection_reason: `desired_material = ${desired_material} is premium material`,
    };
  }

  // Priority 3: Standard
  const standardProfile = profiles[MARGIN_PROFILE.STANDARD];
  return {
    profile_key: MARGIN_PROFILE.STANDARD,
    rate: standardProfile.rate,
    selection_reason: 'Default standard profile',
  };
}


// ── FLOOR PROTECTION ──

function applyFloor(totalMin, totalExpected, area_m2) {
  const floor = pricingConfig.minimum_project_floor;

  if (totalMin >= floor) {
    return {
      applied: false,
      delta_amount: 0,
      reason: null,
      adjusted_min: totalMin,
    };
  }

  // Determine reason
  let reason;
  if (area_m2 < 60) {
    reason = FLOOR_REASON.PROJECT_BELOW_MINIMUM_VIABLE_SIZE;
  } else if (totalExpected < floor) {
    // Full calculated price (including margin) is below floor —
    // the project is simply too cheap at standard rates.
    reason = FLOOR_REASON.CALCULATED_PRICE_BELOW_COST_FLOOR;
  } else {
    // totalExpected >= floor but totalMin < floor.
    // The min-scenario squeezes below floor due to module variance.
    reason = FLOOR_REASON.MARGIN_SQUEEZE_PROTECTION;
  }

  return {
    applied: true,
    delta_amount: floor - totalMin,
    reason,
    adjusted_min: floor,
  };
}


// ── TOTAL INVARIANT: min <= expected <= max ──
// This is the final safety net. If floor pushed min above expected,
// expected is clamped up. If expected exceeds max, max is clamped up.
// No matter what upstream modules produce, the output is always ordered.

function enforceTotalInvariant(min, expected, max) {
  const safeExpected = Math.max(min, expected);
  const safeMax = Math.max(safeExpected, max);
  return { min, expected: safeExpected, max: safeMax };
}
