/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamp an enum value within an ordered list.
 * Returns the clamped enum value.
 * clampEnum('MED_HIGH', orderedList, 'LOW', 'HIGH') → 'MED_HIGH'
 */
export function clampEnum(value, orderedList, minValue, maxValue) {
  const idx = orderedList.indexOf(value);
  const minIdx = orderedList.indexOf(minValue);
  const maxIdx = orderedList.indexOf(maxValue);

  if (idx === -1) return minValue;

  const clamped = Math.max(minIdx, Math.min(maxIdx, idx));
  return orderedList[clamped];
}

/**
 * Step an enum value up by N steps within an ordered list.
 * stepEnum('LOW', 2, orderedList) → 'MED'
 */
export function stepEnum(value, steps, orderedList) {
  const idx = orderedList.indexOf(value);
  if (idx === -1) return orderedList[0];

  const newIdx = Math.min(orderedList.length - 1, Math.max(0, idx + steps));
  return orderedList[newIdx];
}
