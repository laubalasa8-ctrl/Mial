/**
 * Ferotect Offer Engine — Public API
 *
 * Single entry point for the offer engine.
 * Import this module to run calculations.
 *
 * Usage:
 *   import { runOfferEngine } from './src/ferotect/offer-engine/index.js';
 *
 *   const result = runOfferEngine({
 *     roof_type: 'SAD',
 *     desired_material: 'BETONG_STANDARD',
 *     postal_code: '58223',
 *     area_raw_input: { exact_m2: 180 },
 *     existing_material: 'BETONG',
 *     roof_age_band: '20_35',
 *     symptom_flags: ['BROKEN_TILES'],
 *     floors: '1.5',
 *     addon_gutters: 'YES',
 *     addon_chimney: { action: 'NO', count: 0 },
 *     addon_roof_windows: { action: 'NO', count: 0 },
 *     addon_snow_safety: 'YES',
 *   });
 *
 *   // result.calculated_result  — Full internal result (never expose to customer)
 *   // result.presented_result   — Customer-safe result (safe to display)
 *   // result.sales_guidance_result — Internal sales brief
 */

export { default as runOfferEngine } from './runOfferEngine.js';

// Re-export enums for consumers
export {
  ROOF_TYPE,
  DESIRED_MATERIAL,
  EXISTING_MATERIAL,
  AREA_METHOD,
  SIZE_CLASS,
  OUTPUT_MODE,
  CONFIDENCE_CLASS,
  SUBSTRATE_RISK,
  MARGIN_PROFILE,
  FLOOR_REASON,
  POSTAL_ZONE,
  SYMPTOM,
  ADDON_ANSWER,
  ROOF_AGE_BAND,
  FLOORS,
  PROPERTY_ACCESS,
  LEAD_TIMELINE,
  OWNERSHIP_STATUS,
  MODULE_ID,
  SCAFFOLD_ASSUMPTION,
  MVP_SUPPORTED_ROOF_TYPES,
} from './contracts/enums.js';

// Re-export zone resolver for external postal code lookups
export { resolvePostalZone } from './config/zones.config.js';
