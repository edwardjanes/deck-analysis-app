// Reference data sourced from public sources (Damodaran/NYU Stern, Equidam's published industry multiples) as of Aug 2026.
// NOT Equidam's proprietary/internal data — Equidam doesn't publish theirs. All values are editable by the user.
// Country avgSeedPreMoney is still illustrative except DE (validated against the NovaCloud reference report).
// Sources: Risk-free rates from Trading Economics (10Y govn't bond yields, Aug 21 2026);
//          Equity risk premiums from Damodaran/NYU Stern "Country Default Spreads" (Jan 2026 update);
//          Industry beta from Damodaran unlevered beta (Jan 2026 update);
//          Industry multiples from Equidam published TRBC data (Feb–July 2026).

export const COUNTRIES = {
  US: { avgSeedPreMoney: 6590000,  checklistMaxValuation: 15000000, riskFree10Y: 0.047, equityRiskPremium: 0.0446, corporateTaxRate: 0.2557 },
  GB: { avgSeedPreMoney: 5531000,  checklistMaxValuation: 12919000, riskFree10Y: 0.051, equityRiskPremium: 0.0501, corporateTaxRate: 0.2500 },
  DE: { avgSeedPreMoney: 6107000,  checklistMaxValuation: 13161000, riskFree10Y: 0.033, equityRiskPremium: 0.0423, corporateTaxRate: 0.3006 },
  FR: { avgSeedPreMoney: 6446000,  checklistMaxValuation: 12576000, riskFree10Y: 0.041, equityRiskPremium: 0.0501, corporateTaxRate: 0.3613 },
  NL: { avgSeedPreMoney: 5721000,  checklistMaxValuation: 12705000, riskFree10Y: 0.033, equityRiskPremium: 0.0423, corporateTaxRate: 0.2580 },
  IE: { avgSeedPreMoney: 6469000,  checklistMaxValuation: 15209000, riskFree10Y: 0.034, equityRiskPremium: 0.0501, corporateTaxRate: 0.1250 },
  ES: { avgSeedPreMoney: 4586000,  checklistMaxValuation: 9991000,  riskFree10Y: 0.037, equityRiskPremium: 0.0578, corporateTaxRate: 0.2500 },
  IT: { avgSeedPreMoney: 3919000,  checklistMaxValuation: 7277000,  riskFree10Y: 0.041, equityRiskPremium: 0.0669, corporateTaxRate: 0.2781 },
  SE: { avgSeedPreMoney: 4961000,  checklistMaxValuation: 9070000,  riskFree10Y: 0.030, equityRiskPremium: 0.0423, corporateTaxRate: 0.2060 },
  CH: { avgSeedPreMoney: 6604000,  checklistMaxValuation: 14860000, riskFree10Y: 0.004, equityRiskPremium: 0.0423, corporateTaxRate: 0.1961 },
  IL: { avgSeedPreMoney: 6624000,  checklistMaxValuation: 15263000, riskFree10Y: 0.038, equityRiskPremium: 0.0630, corporateTaxRate: 0.2300 },
  AE: { avgSeedPreMoney: 6542000,  checklistMaxValuation: 13400000, riskFree10Y: 0.052, equityRiskPremium: 0.0487, corporateTaxRate: 0.0900 },
  SG: { avgSeedPreMoney: 5961000,  checklistMaxValuation: 15020000, riskFree10Y: 0.024, equityRiskPremium: 0.0423, corporateTaxRate: 0.1700 },
  HK: { avgSeedPreMoney: 6871000,  checklistMaxValuation: 13194000, riskFree10Y: 0.036, equityRiskPremium: 0.0501, corporateTaxRate: 0.1650 },
  IN: { avgSeedPreMoney: 3425000,  checklistMaxValuation: 9398000,  riskFree10Y: 0.069, equityRiskPremium: 0.0708, corporateTaxRate: 0.3000 },
  CN: { avgSeedPreMoney: 10250000, checklistMaxValuation: 14619000, riskFree10Y: 0.017, equityRiskPremium: 0.0514, corporateTaxRate: 0.2500 },
  JP: { avgSeedPreMoney: 6208000,  checklistMaxValuation: 11920000, riskFree10Y: 0.029, equityRiskPremium: 0.0514, corporateTaxRate: 0.2974 },
  KR: { avgSeedPreMoney: 6690000,  checklistMaxValuation: 12846000, riskFree10Y: 0.044, equityRiskPremium: 0.0487, corporateTaxRate: 0.2640 },
  CA: { avgSeedPreMoney: 6390000,  checklistMaxValuation: 14256000, riskFree10Y: 0.038, equityRiskPremium: 0.0423, corporateTaxRate: 0.2598 },
  BR: { avgSeedPreMoney: 4021000,  checklistMaxValuation: 9451000,  riskFree10Y: 0.146, equityRiskPremium: 0.0747, corporateTaxRate: 0.3400 },
  MX: { avgSeedPreMoney: 7692000,  checklistMaxValuation: 15367000, riskFree10Y: 0.092, equityRiskPremium: 0.0669, corporateTaxRate: 0.3000 },
  AU: { avgSeedPreMoney: 4186000,  checklistMaxValuation: 9756000,  riskFree10Y: 0.050, equityRiskPremium: 0.0423, corporateTaxRate: 0.3000 },
  ZA: { avgSeedPreMoney: 3027000,  checklistMaxValuation: 6726000,  riskFree10Y: 0.088, equityRiskPremium: 0.0813, corporateTaxRate: 0.2700 },
  NG: { avgSeedPreMoney: 2223000,  checklistMaxValuation: 5676000,  riskFree10Y: 0.171, equityRiskPremium: 0.1264, corporateTaxRate: 0.3000 },
  PL: { avgSeedPreMoney: 6068000,  checklistMaxValuation: 14656000, riskFree10Y: 0.059, equityRiskPremium: 0.0533, corporateTaxRate: 0.1900 },
  default: { avgSeedPreMoney: 2500000, checklistMaxValuation: 5500000, riskFree10Y: 0.050, equityRiskPremium: 0.070, corporateTaxRate: 0.2400 },
} as const;

export const INDUSTRIES = {
  SaaS:        { beta: 1.23, ebitdaMultiple: 6.77, revenueMultiple: 1.04 },
  Fintech:     { beta: 0.78, ebitdaMultiple: 6.77, revenueMultiple: 1.04 },
  AI_ML:       { beta: 1.55, ebitdaMultiple: 6.77, revenueMultiple: 1.04 },
  Marketplace: { beta: 0.92, ebitdaMultiple: 8.00, revenueMultiple: 1.19 },
  Ecommerce:   { beta: 0.76, ebitdaMultiple: 8.00, revenueMultiple: 1.19 },
  Healthtech:  { beta: 0.69, ebitdaMultiple: 7.94, revenueMultiple: 1.29 },
  Biotech:     { beta: 1.03, ebitdaMultiple: 7.90, revenueMultiple: 1.30 },
  Hardware:    { beta: 1.31, ebitdaMultiple: 7.26, revenueMultiple: 0.85 },
  Deeptech:    { beta: 1.40, ebitdaMultiple: 10.47, revenueMultiple: 1.29 },
  Cleantech:   { beta: 0.46, ebitdaMultiple: 9.35, revenueMultiple: 3.55 },
  MobileApp:   { beta: 1.55, ebitdaMultiple: 6.77, revenueMultiple: 1.04 },
  Gaming:      { beta: 1.01, ebitdaMultiple: 6.93, revenueMultiple: 1.73 },
  EdTech:      { beta: 0.66, ebitdaMultiple: 4.68, revenueMultiple: 0.81 },
  Logistics:   { beta: 0.85, ebitdaMultiple: 7.15, revenueMultiple: 0.89 },
  PropTech:    { beta: 0.58, ebitdaMultiple: 6.53, revenueMultiple: 2.39 },
  Media:       { beta: 0.48, ebitdaMultiple: 6.08, revenueMultiple: 0.81 },
  default:     { beta: 1.05, ebitdaMultiple: 9, revenueMultiple: 3 },
} as const;

export const VC_REQUIRED_ROI = {
  idea: 1.3593,
  development: 1.1147,
  startup: 0.8912,
  expansion: 0.4860,
  growth: 0.3620,
  maturity: 0.2610,
} as const;

export const STAGE_DEFAULT_WEIGHTS = {
  idea: { scorecard: 0.38, checklist: 0.38, vc: 0.16, dcf_ltg: 0.04, dcf_multiple: 0.04, multiples: 0 },
  development: { scorecard: 0.30, checklist: 0.30, vc: 0.16, dcf_ltg: 0.12, dcf_multiple: 0.12, multiples: 0 },
  startup: { scorecard: 0.15, checklist: 0.15, vc: 0.16, dcf_ltg: 0.27, dcf_multiple: 0.27, multiples: 0 },
  expansion: { scorecard: 0.06, checklist: 0.06, vc: 0.16, dcf_ltg: 0.36, dcf_multiple: 0.36, multiples: 0 },
  growth: { scorecard: 0, checklist: 0, vc: 0.20, dcf_ltg: 0.40, dcf_multiple: 0.40, multiples: 0 },
  maturity: { scorecard: 0, checklist: 0, vc: 0, dcf_ltg: 0.50, dcf_multiple: 0.50, multiples: 0 },
} as const;

export const SURVIVAL_RATES = [0.8869, 0.7945, 0.7164, 0.6487, 0.5891, 0.5357];
export const ILLIQUIDITY_DISCOUNT_DEFAULT = 0.25;
export const LTG_GROWTH_RATE_DEFAULT = 0.025;
export const LTG_GROWTH_RATE_MIN = 0.001;
export const LTG_GROWTH_RATE_MAX = 0.025;

export const SCORECARD_CRITERIA_WEIGHTS = {
  team: 0.30,
  opportunity: 0.25,
  competitive_env: 0.10,
  product_ip: 0.15,
  partnerships: 0.10,
  funding_required: 0.10,
} as const;

export const CHECKLIST_CRITERIA_WEIGHTS = {
  team: 0.30,
  idea: 0.20,
  product_ip: 0.15,
  relationships: 0.15,
  operating_stage: 0.20,
} as const;
