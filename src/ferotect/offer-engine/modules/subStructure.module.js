import { MODULE_ID, SUBSTRATE_RISK } from '../contracts/enums.js';
import { createModuleResult } from '../contracts/outputSchema.js';
import pricingConfig from '../config/pricing.config.js';
import rulesConfig from '../config/rules.config.js';

/**
 * M_SUB_STRUCTURE — Structural substrate module (råspont/bärande underlag)
 *
 * This is the primary span driver in the system.
 * Calculates min/max/expected based on substrate risk class.
 *
 * Customer sees: "Eventuellt byte av råspont och underlagskonstruktion (avgörs vid besiktning)"
 */
export default function computeSubStructure({ area_m2, substrate_risk }) {
  const riskParams = rulesConfig.substrate_probability[substrate_risk];
  if (!riskParams) {
    return createModuleResult(MODULE_ID.M_SUB_STRUCTURE, {
      included: true,
      customer_visible: true,
      flags: ['UNKNOWN_SUBSTRATE_RISK_CLASS'],
      assumptions: [`Unknown substrate risk class: ${substrate_risk}`],
    });
  }

  const costPerM2 = pricingConfig.sub_structure_cost_per_m2;
  const medianCoverage = rulesConfig.median_coverage[substrate_risk] || 0.22;

  const min = Math.round(area_m2 * riskParams.coverage_min * costPerM2);
  const max = Math.round(area_m2 * riskParams.coverage_max * costPerM2);
  const expected = Math.round(area_m2 * medianCoverage * costPerM2);

  const assumptions = [
    `Substrate risk: ${substrate_risk}`,
    `Probability of work needed: ${(riskParams.probability * 100).toFixed(0)}%`,
    `Coverage range: ${(riskParams.coverage_min * 100).toFixed(0)}%–${(riskParams.coverage_max * 100).toFixed(0)}% of roof area`,
    `Cost per m²: ${costPerM2} kr`,
  ];

  return createModuleResult(MODULE_ID.M_SUB_STRUCTURE, {
    included: true,
    customer_visible: true,
    min,
    max,
    expected,
    assumptions,
    flags: substrate_risk === SUBSTRATE_RISK.HIGH ? ['HIGH_SUBSTRATE_RISK'] : [],
    _breakdown: {
      substrate_risk,
      probability: riskParams.probability,
      coverage_min: riskParams.coverage_min,
      coverage_max: riskParams.coverage_max,
      median_coverage: medianCoverage,
      cost_per_m2: costPerM2,
      area_m2,
    },
  });
}
