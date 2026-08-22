import {
  CompanyProfile,
  FinancialYear,
  QuestionnaireAnswers,
  UpdatedValuationParameters,
  ValuationReportOutput,
  ValuationMethodKey,
} from './types';
import { deriveFcfeByYear } from './fcf';
import { computeScorecard } from './scorecard';
import { computeChecklist } from './checklist';
import { computeVcMethod } from './vc';
import { computeDcfShared } from './dcf';
import { computeSimpleMultiples, ComparableCompany } from './simpleMultiples';
import { deriveScorecardCriteriaScores, deriveChecklistCriteriaScores } from './scoring';
import { buildDefaultParameters } from './defaults';

export async function computeValuation(
  profile: CompanyProfile,
  financials: FinancialYear[],
  questionnaire: QuestionnaireAnswers | null,
  parameters: UpdatedValuationParameters
): Promise<ValuationReportOutput> {
  // Derive FCFE for all years
  const fcfeByYear = deriveFcfeByYear(financials);

  // Discount rate from parameters
  const discountRate = parameters.dcf_shared.discount_rate;

  // Scorecard result
  const scorecardScores = questionnaire ? deriveScorecardCriteriaScores(questionnaire) : {};
  const scorecardResult = computeScorecard(
    scorecardScores as Record<string, { weight: number; score: number }>,
    parameters.scorecard.average_pre_money_valuation
  );

  // Checklist result
  const checklistScores = questionnaire ? deriveChecklistCriteriaScores(questionnaire) : {};
  const checklistResult = computeChecklist(
    checklistScores as Record<string, { weight: number; score: number }>,
    parameters.checklist.max_valuation
  );

  // VC Method result
  const vcResult = computeVcMethod(
    parameters.vc_method.terminal_metric_value,
    parameters.vc_method.industry_multiple,
    parameters.vc_method.required_roi,
    parameters.vc_method.projection_years,
    0
  );

  // DCF LTG result
  const terminalValueLtg =
    (fcfeByYear[fcfeByYear.length - 1]?.fcfe || 0) *
    parameters.dcf_ltg.survival_rates[5] *
    (1 + parameters.dcf_ltg.terminal_growth_rate) /
    (discountRate - parameters.dcf_ltg.terminal_growth_rate);

  const dcfLtgResult = computeDcfShared(
    fcfeByYear,
    terminalValueLtg,
    discountRate,
    parameters.dcf_shared.illiquidity_discount,
    parameters.dcf_shared.non_operating_cash
  );

  // DCF Multiple result
  const lastYearFinancial = financials.find((f) => f.yearOffset === -1);
  const lastYearRevenue = lastYearFinancial?.revenue || 0;
  const terminalValueMultiple = lastYearRevenue * parameters.dcf_multiple.exit_multiple;

  const dcfMultipleResult = computeDcfShared(
    fcfeByYear,
    terminalValueMultiple,
    discountRate,
    parameters.dcf_shared.illiquidity_discount,
    parameters.dcf_shared.non_operating_cash
  );

  // Simple Multiples result
  const comparables: ComparableCompany[] = (parameters.comparables || []).map((c: any) => ({
    name: c.name,
    metric: c.metric,
    multiple: c.multiple,
    metricType: c.metricType || 'revenue',
  }));

  const multiplesResult = computeSimpleMultiples(parameters.simple_multiples.last_year_metric, comparables);

  // Weighted valuation
  const methodResults = {
    scorecard: scorecardResult,
    checklist: checklistResult,
    vc: vcResult,
    dcfLtg: dcfLtgResult,
    dcfMultiple: dcfMultipleResult,
    multiples: multiplesResult,
  };

  const methodValuations = {
    scorecard: scorecardResult.valuation,
    checklist: checklistResult.valuation,
    vc_method: vcResult.valuation,
    dcf_ltg: dcfLtgResult.valuation,
    dcf_multiple: dcfMultipleResult.valuation,
    simple_multiples: multiplesResult.valuation,
  };

  const perMethod: ValuationReportOutput['perMethod'] = (
    Object.entries(parameters.method_weights) as [ValuationMethodKey, number][]
  ).map(([method, weight]) => {
    const valuationKey = method === 'multiples' ? 'simple_multiples' :
                         method === 'dcf_ltg' ? 'dcf_ltg' :
                         method === 'dcf_multiple' ? 'dcf_multiple' :
                         method === 'vc' ? 'vc_method' :
                         method as keyof typeof methodValuations;
    const valuation = methodValuations[valuationKey] || 0;
    const weightedContribution = valuation * weight;

    return {
      method,
      valuation,
      weight,
      weightedContribution,
    };
  });

  const weightedValuation = perMethod.reduce((sum, m) => sum + m.weightedContribution, 0);

  // Bounds (±9.6% as per Equidam methodology)
  const lowBound = weightedValuation * 0.904;
  const highBound = weightedValuation * 1.096;

  return {
    methodResults,
    weightedValuation,
    lowBound,
    highBound,
    perMethod,
    discountRate,
    fcfeByYear,
    generatedAt: new Date().toISOString(),
  };
}
