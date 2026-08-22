// ILLUSTRATIVE DEFAULTS — NOT Equidam's proprietary data. All values are editable by the user.

export const COUNTRIES = {
  US: { avgSeedPreMoney: 6500000, riskFree10Y: 0.043, equityRiskPremium: 0.045 },
  GB: { avgSeedPreMoney: 4200000, riskFree10Y: 0.042, equityRiskPremium: 0.050 },
  DE: { avgSeedPreMoney: 4164857, riskFree10Y: 0.025, equityRiskPremium: 0.055 },
  FR: { avgSeedPreMoney: 3800000, riskFree10Y: 0.030, equityRiskPremium: 0.055 },
  NL: { avgSeedPreMoney: 4000000, riskFree10Y: 0.027, equityRiskPremium: 0.050 },
  IE: { avgSeedPreMoney: 3600000, riskFree10Y: 0.028, equityRiskPremium: 0.055 },
  ES: { avgSeedPreMoney: 2800000, riskFree10Y: 0.032, equityRiskPremium: 0.060 },
  IT: { avgSeedPreMoney: 2600000, riskFree10Y: 0.036, equityRiskPremium: 0.065 },
  SE: { avgSeedPreMoney: 4500000, riskFree10Y: 0.022, equityRiskPremium: 0.050 },
  CH: { avgSeedPreMoney: 5000000, riskFree10Y: 0.008, equityRiskPremium: 0.045 },
  IL: { avgSeedPreMoney: 5500000, riskFree10Y: 0.045, equityRiskPremium: 0.060 },
  AE: { avgSeedPreMoney: 3500000, riskFree10Y: 0.045, equityRiskPremium: 0.065 },
  SG: { avgSeedPreMoney: 4800000, riskFree10Y: 0.028, equityRiskPremium: 0.050 },
  HK: { avgSeedPreMoney: 4000000, riskFree10Y: 0.035, equityRiskPremium: 0.060 },
  IN: { avgSeedPreMoney: 1800000, riskFree10Y: 0.069, equityRiskPremium: 0.080 },
  CN: { avgSeedPreMoney: 3000000, riskFree10Y: 0.022, equityRiskPremium: 0.075 },
  JP: { avgSeedPreMoney: 3200000, riskFree10Y: 0.014, equityRiskPremium: 0.055 },
  KR: { avgSeedPreMoney: 3000000, riskFree10Y: 0.030, equityRiskPremium: 0.065 },
  CA: { avgSeedPreMoney: 4500000, riskFree10Y: 0.033, equityRiskPremium: 0.050 },
  BR: { avgSeedPreMoney: 1800000, riskFree10Y: 0.115, equityRiskPremium: 0.095 },
  MX: { avgSeedPreMoney: 1500000, riskFree10Y: 0.095, equityRiskPremium: 0.085 },
  AU: { avgSeedPreMoney: 3800000, riskFree10Y: 0.043, equityRiskPremium: 0.055 },
  ZA: { avgSeedPreMoney: 1200000, riskFree10Y: 0.105, equityRiskPremium: 0.090 },
  NG: { avgSeedPreMoney: 800000, riskFree10Y: 0.140, equityRiskPremium: 0.105 },
  PL: { avgSeedPreMoney: 1600000, riskFree10Y: 0.055, equityRiskPremium: 0.070 },
  default: { avgSeedPreMoney: 2500000, riskFree10Y: 0.050, equityRiskPremium: 0.070 },
} as const;

export const INDUSTRIES = {
  SaaS: { beta: 1.15, ebitdaMultiple: 15, revenueMultiple: 6 },
  Fintech: { beta: 1.25, ebitdaMultiple: 12, revenueMultiple: 5 },
  AI_ML: { beta: 1.35, ebitdaMultiple: 18, revenueMultiple: 8 },
  Marketplace: { beta: 1.10, ebitdaMultiple: 10, revenueMultiple: 3 },
  Ecommerce: { beta: 0.95, ebitdaMultiple: 8, revenueMultiple: 1.5 },
  Healthtech: { beta: 1.05, ebitdaMultiple: 14, revenueMultiple: 5 },
  Biotech: { beta: 1.45, ebitdaMultiple: 0, revenueMultiple: 10 },
  Hardware: { beta: 1.00, ebitdaMultiple: 9, revenueMultiple: 2.5 },
  Deeptech: { beta: 1.30, ebitdaMultiple: 11, revenueMultiple: 4 },
  Cleantech: { beta: 0.90, ebitdaMultiple: 9, revenueMultiple: 3 },
  MobileApp: { beta: 1.20, ebitdaMultiple: 10, revenueMultiple: 4 },
  Gaming: { beta: 1.10, ebitdaMultiple: 9, revenueMultiple: 3 },
  EdTech: { beta: 1.00, ebitdaMultiple: 10, revenueMultiple: 4 },
  Logistics: { beta: 0.85, ebitdaMultiple: 8, revenueMultiple: 1.2 },
  PropTech: { beta: 0.95, ebitdaMultiple: 9, revenueMultiple: 2 },
  Media: { beta: 0.90, ebitdaMultiple: 8, revenueMultiple: 2.5 },
  default: { beta: 1.05, ebitdaMultiple: 9, revenueMultiple: 3 },
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
