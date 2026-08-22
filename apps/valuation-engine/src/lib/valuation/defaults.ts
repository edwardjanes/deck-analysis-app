import {
  UpdatedValuationParameters,
  CompanyProfile,
  FinancialYear,
  CompanyStage,
} from './types';
import {
  COUNTRIES,
  INDUSTRIES,
  STAGE_DEFAULT_WEIGHTS,
  VC_REQUIRED_ROI,
  ILLIQUIDITY_DISCOUNT_DEFAULT,
  LTG_GROWTH_RATE_DEFAULT,
} from './referenceData';

export function buildDefaultParameters(
  profile: CompanyProfile,
  financials: FinancialYear[]
): UpdatedValuationParameters {
  const countryData = {
    name: profile.country,
    avg_seed_pre_money: 4_000_000,
    risk_free_rate: 0.04,
    equity_risk_premium: 0.065,
  };

  const industryData = {
    name: profile.industry,
    beta: 1.2,
    revenue_multiple: 5.5,
  };

  const stageNormalized = (profile.stage as string).toLowerCase();
  const stageWeights =
    STAGE_DEFAULT_WEIGHTS[stageNormalized as keyof typeof STAGE_DEFAULT_WEIGHTS] ||
    STAGE_DEFAULT_WEIGHTS.development;

  const requiredRoi =
    VC_REQUIRED_ROI[stageNormalized as keyof typeof VC_REQUIRED_ROI] || VC_REQUIRED_ROI.development;

  // Last year revenue (yearOffset: -1)
  const lastYearFinancial = financials.find((f) => f.yearOffset === -1);
  const lastYearRevenue = lastYearFinancial?.revenue || 0;

  // Terminal year revenue (yearOffset: 5, or last available)
  const terminalFinancial = financials.find((f) => f.yearOffset === 5) || financials[financials.length - 1];
  const terminalRevenue = terminalFinancial?.revenue || lastYearRevenue;

  // Discount rate via CAPM
  const discountRate = countryData.risk_free_rate + industryData.beta * countryData.equity_risk_premium;

  return {
    stage: profile.stage,

    // Method weights
    method_weights: {
      scorecard: stageWeights.scorecard || 0,
      checklist: stageWeights.checklist || 0,
      vc: stageWeights.vc || 0.16,
      dcf_ltg: stageWeights.dcf_ltg || 0.27,
      dcf_multiple: stageWeights.dcf_multiple || 0.27,
      multiples: stageWeights.multiples || 0,
    },

    // Scorecard parameters
    scorecard: {
      average_pre_money_valuation:
        countryData.avg_seed_pre_money * (1 + Math.log(lastYearRevenue / 10_000) * 0.1),
    },

    // Checklist parameters
    checklist: {
      max_valuation: countryData.avg_seed_pre_money * 3,
    },

    // VC Method parameters
    vc_method: {
      terminal_metric_value: terminalRevenue,
      industry_multiple: industryData.revenue_multiple,
      required_roi: requiredRoi,
      projection_years: 5,
    },

    // DCF shared parameters
    dcf_shared: {
      discount_rate: discountRate,
      illiquidity_discount: ILLIQUIDITY_DISCOUNT_DEFAULT,
      non_operating_cash: 0,
    },

    // DCF LTG parameters
    dcf_ltg: {
      terminal_growth_rate: LTG_GROWTH_RATE_DEFAULT,
      survival_rates: [0.8869, 0.7945, 0.7164, 0.6487, 0.5891, 0.5357],
    },

    // DCF Multiple parameters
    dcf_multiple: {
      exit_multiple: industryData.revenue_multiple,
      survival_rates: [0.8869, 0.7945, 0.7164, 0.6487, 0.5891, 0.5357],
    },

    // Simple Multiples parameters
    simple_multiples: {
      last_year_metric: lastYearRevenue,
      metric_type: 'revenue',
    },

    // Comparables (empty by default, user-filled)
    comparables: [],
  };
}
