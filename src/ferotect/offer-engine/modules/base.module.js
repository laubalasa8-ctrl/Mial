import { MODULE_ID, CONFIDENCE_FLAG } from '../contracts/enums.js';
import { createModuleResult } from '../contracts/outputSchema.js';
import pricingConfig from '../config/pricing.config.js';
import rulesConfig from '../config/rules.config.js';

/**
 * M_BASE — Base price module
 *
 * Calculates: material + work per m²
 * Includes: M_SUB_LAYER (underlayer) as standard component
 * Includes: M_COMPLEXITY inline (not separated to customer)
 * Includes: M_LOGISTICS inline
 *
 * Customer sees: "Material och arbete"
 */
export default function computeBase({ area_m2, desired_material, roof_type, postal_zone }) {
  const unitPrice = pricingConfig.unit_price[desired_material];
  if (unitPrice === undefined) {
    return createModuleResult(MODULE_ID.M_BASE, {
      flags: ['MISSING_UNIT_PRICE'],
    });
  }

  const complexityFactor = rulesConfig.complexity_factor[roof_type] || 1.0;
  const logisticsRate = pricingConfig.logistics_rate[postal_zone] || 0;
  const underlayerCost = pricingConfig.underlayer_cost_per_m2;

  // Base = (unit_price + underlayer) × area × complexity × (1 + logistics)
  const rawBase = (unitPrice + underlayerCost) * area_m2;
  const withComplexity = rawBase * complexityFactor;
  const withLogistics = withComplexity * (1 + logisticsRate);

  const assumptions = [];
  if (complexityFactor !== 1.0) {
    assumptions.push(`Complexity factor ${complexityFactor} applied for roof type ${roof_type}`);
  }
  if (logisticsRate > 0) {
    assumptions.push(`Logistics rate ${(logisticsRate * 100).toFixed(0)}% applied for zone ${postal_zone}`);
  }
  assumptions.push('Underlayer (underlagspapp) included in base price as standard component');

  return createModuleResult(MODULE_ID.M_BASE, {
    included: true,
    customer_visible: true,
    min: Math.round(withLogistics),
    max: Math.round(withLogistics),
    expected: Math.round(withLogistics),
    assumptions,
    _breakdown: {
      unit_price: unitPrice,
      underlayer_per_m2: underlayerCost,
      area_m2,
      complexity_factor: complexityFactor,
      logistics_rate: logisticsRate,
      raw_base: Math.round(rawBase),
      with_complexity: Math.round(withComplexity),
      with_logistics: Math.round(withLogistics),
    },
  });
}
