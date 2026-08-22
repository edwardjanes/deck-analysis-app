import { DcfResult, FcfeYear } from "./types";
import { SURVIVAL_RATES } from "./referenceData";

export function computeDcfShared(
  fcfeYears: FcfeYear[],
  terminalValue: number,
  discountRate: number,
  illiquidityDiscount: number,
  nonOperatingCash: number = 0
): DcfResult {
  // Sum discounted cash flows: Σ[t=1..n] (FCFE_t × SurvivalRate_t) / (1+DR)^t
  let discountedFcfSum = 0;
  for (const fcfeYear of fcfeYears) {
    const survivalRate = SURVIVAL_RATES[fcfeYear.yearOffset - 1] ?? SURVIVAL_RATES[SURVIVAL_RATES.length - 1] ?? 0.5;
    const discount = Math.pow(1 + discountRate, fcfeYear.yearOffset);
    discountedFcfSum += (fcfeYear.fcfe * survivalRate) / discount;
  }

  // Discount terminal value: TV / (1+DR)^n × (1 - ID)
  const finalYearOffset = fcfeYears[fcfeYears.length - 1]?.yearOffset || 3;
  const discountFactor = Math.pow(1 + discountRate, finalYearOffset);
  const discountedTerminalValue = terminalValue / discountFactor;
  const illiquidityAdjustedTerminalValue = discountedTerminalValue * (1 - illiquidityDiscount);

  const valuation = discountedFcfSum + illiquidityAdjustedTerminalValue + nonOperatingCash;

  return {
    discountedFcfSum,
    terminalValue,
    discountedTerminalValue,
    illiquidityAdjustedTerminalValue,
    nonOperatingCash,
    valuation: Math.max(0, valuation),
  };
}
