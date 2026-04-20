import { POSTAL_ZONE } from '../contracts/enums.js';

/**
 * Postal zone mapping.
 * Maps postal code prefixes (first 2 or 3 digits) to zones.
 *
 * PLACEHOLDER: Must be populated with Ferotect's actual service areas.
 * Structure supports prefix matching: longest matching prefix wins.
 */
const zonesConfig = Object.freeze({

  // Default zone if no prefix matches
  default_zone: POSTAL_ZONE.OUTER,

  // Prefix → zone mapping
  // Example entries — REPLACE with real Ferotect zones before use
  prefix_map: Object.freeze({
    // Core area (Ferotect's home region — placeholder)
    '58': POSTAL_ZONE.CORE,
    '581': POSTAL_ZONE.CORE,
    '582': POSTAL_ZONE.CORE,
    '583': POSTAL_ZONE.CORE,

    // Mid zone
    '59': POSTAL_ZONE.MID,
    '57': POSTAL_ZONE.MID,
    '56': POSTAL_ZONE.MID,
    '61': POSTAL_ZONE.MID,
    '60': POSTAL_ZONE.MID,

    // Everything else falls to default_zone (OUTER)
  }),
});

/**
 * Resolve a postal code to a zone.
 * Matches longest prefix first.
 */
export function resolvePostalZone(postalCode) {
  if (!postalCode || typeof postalCode !== 'string') {
    return zonesConfig.default_zone;
  }

  const cleaned = postalCode.replace(/\s/g, '');

  // Try longest prefix first (3 digits, then 2)
  for (let len = 3; len >= 2; len--) {
    const prefix = cleaned.substring(0, len);
    if (zonesConfig.prefix_map[prefix] !== undefined) {
      return zonesConfig.prefix_map[prefix];
    }
  }

  return zonesConfig.default_zone;
}

export default zonesConfig;
