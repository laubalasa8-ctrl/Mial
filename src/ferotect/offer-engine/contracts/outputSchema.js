import { OUTPUT_MODE, CONFIDENCE_CLASS, MODULE_ID } from './enums.js';

/**
 * Creates a blank module result object.
 */
export function createModuleResult(moduleId, overrides = {}) {
  return {
    module_id: moduleId,
    included: false,
    customer_visible: false,
    min: 0,
    max: 0,
    expected: 0,
    assumptions: [],
    flags: [],
    ...overrides,
  };
}

/**
 * Creates the full calculated_result shell.
 * This is the internal, unfiltered result object.
 */
export function createCalculatedResult() {
  return {
    // Module results
    modules: {},

    // Aggregated price
    total_min: 0,
    total_max: 0,
    total_expected: 0,

    // Confidence
    confidence: {
      geometry: 0,
      material: 0,
      condition: 0,
      addon: 0,
      weighted_before_penalties: 0,
      unknown_burden: 0,
      total: 0,
      confidence_class: CONFIDENCE_CLASS.INSUFFICIENT,
    },

    // Output mode
    output_mode: OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED,
    output_mode_caps_applied: [],

    // Margin
    margin: {
      profile_key: null,
      rate: 0,
      absolute: 0,
      selection_reason: '',
    },

    // Floor protection
    floor: {
      applied: false,
      delta_amount: 0,
      reason: null,
    },

    // Risk
    substrate_risk: null,
    asbestos_flag: false,

    // Scaffold
    scaffold_required: false,
    scaffold_assumption: null,

    // Area
    area_m2: 0,
    area_method: null,
    slope_factor: 0,

    // Postal
    postal_zone: null,

    // All assumptions made by the engine
    assumptions: [],

    // Triggered rules/warnings
    warnings: [],

    // Lead quality (simplified MVP: 0-5)
    lead_quality_score: 0,

    // Metadata
    session_id: null,
    created_at: null,
    engine_version: '1.0.0-mvp',
  };
}

/**
 * Creates the presented_result shell.
 * This is the customer-facing, filtered result.
 * MUST NEVER contain margin, floor internals, lead score, or internal module details.
 */
export function createPresentedResult() {
  return {
    summary: {
      roof_type_label: '',
      area_estimate_label: '',
      desired_material_label: '',
      existing_material_label: '',
      selected_addons: [],
      uncertain_items: [],
      location_label: '',
      timeline_label: '',
    },

    price: {
      output_mode: OUTPUT_MODE.NO_PRICE_CONTACT_REQUIRED,
      interval_min: null,
      interval_max: null,
      line_items: [],
      // line_item shape: { label, amount_label, is_uncertain }
    },

    confidence_text: '',
    next_step_type: '',
    next_step_text: '',
  };
}

/**
 * Creates the sales_guidance_result shell.
 * Full internal data + operational steering for sales team.
 */
export function createSalesGuidanceResult() {
  return {
    headline: '',
    priority: '',
    lead_quality_score: 0,
    customer_price_expectation: { min: 0, max: 0 },
    internal_target_price: null,

    // Operational steering (new)
    primary_verification_target: null,
    largest_price_risk_driver: null,
    largest_uncertainty_driver: null,
    recommended_sales_action: '',
    pricing_posture: '',
    inspection_priority: '',
    talking_points: [],

    // Existing detail fields
    items_to_verify: [],
    risk_flags: [],
    assumptions: [],
    addon_summary: [],
    floor_info: null,
    scaffold_info: null,
  };
}
