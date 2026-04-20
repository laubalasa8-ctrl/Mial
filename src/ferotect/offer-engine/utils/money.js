/**
 * Round to nearest step.
 * roundTo(213400, 5000) → 215000
 * roundTo(213400, 1000) → 213000
 * roundTo(213400, 25000) → 225000
 */
export function roundTo(value, step) {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

/**
 * Round UP to nearest step (conservative for customer-facing max).
 */
export function roundUpTo(value, step) {
  if (step <= 0) return value;
  return Math.ceil(value / step) * step;
}

/**
 * Round DOWN to nearest step (conservative for customer-facing min).
 */
export function roundDownTo(value, step) {
  if (step <= 0) return value;
  return Math.floor(value / step) * step;
}
