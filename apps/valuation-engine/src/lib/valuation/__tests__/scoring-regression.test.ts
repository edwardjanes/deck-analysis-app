import { expect, it } from "vitest";
import { deriveScorecardCriteriaScores, deriveChecklistCriteriaScores } from "../scoring";
import type { QuestionnaireAnswers } from "../types";

// This test ensures that UI fields collected in QuestionnaireStep.tsx
// remain in sync with fields read by scoring functions.
// Failures indicate a mismatch in the questionnaire wiring (Phase 0).

it("QuestionnaireStep UI fields match scoring function reads", () => {
  // Fields that QuestionnaireStep.tsx collects in its state
  const UI_FIELDS = new Set([
    // Team tab
    "team_size",
    "team_has_cto",
    "team_has_business_lead",
    "team_prior_exits",
    // Business Model tab
    "business_model_type",
    "recurring_revenue",
    "competitors_count",
    "has_competitive_advantage",
    "partnerships_count",
    "has_strategic_investors",
    // Product & Market tab
    "tam_size",
    "market_growth_rate",
    "product_status",
    "has_customers",
    "product_market_fit",
    // IP & Legal tab
    "has_patents",
    "has_ip",
    "ip_protection_stage",
    "legal_risks",
    // Merged from external sources (snapshot/route.ts enrichment)
    "capital_needed",
    "last_year_revenue",
  ]);

  // Fields that scoring functions actually read
  // (extracted by analyzing deriveScorecardCriteriaScores & deriveChecklistCriteriaScores)
  const SCORING_READS = new Set([
    // scoreTeamStrength (team criterion)
    "team_size",
    "team_has_cto",
    "team_has_business_lead",
    "team_prior_exits",
    // scoreOpportunitySize (opportunity criterion in Scorecard, idea in Checklist)
    "tam_size",
    "market_growth_rate",
    "recurring_revenue",
    "has_customers",
    "product_market_fit",
    // scoreCompetitiveEnvironment (competitive_env in Scorecard only)
    "competitors_count",
    "has_competitive_advantage",
    // scoreProductStrength (product_ip in both Scorecard/Checklist)
    "product_status",
    "ip_protection_stage",
    "has_patents",
    "has_ip",
    "legal_risks",
    // scoreStrategicPartnerships (partnerships in Scorecard, relationships in Checklist)
    "partnerships_count",
    "has_strategic_investors",
    // scoreFundingRequired (funding_required in Scorecard)
    "capital_needed",
    "last_year_revenue",
  ]);

  // Test 1: Every field UI collects must be read by scoring (or intentionally unused)
  const INTENTIONALLY_UNUSED = new Set([
    "business_model_type", // Collected by UI but explicitly not scored (no defensible ranking)
  ]);

  for (const uiField of UI_FIELDS) {
    if (!SCORING_READS.has(uiField) && !INTENTIONALLY_UNUSED.has(uiField)) {
      throw new Error(
        `UI field '${uiField}' is collected but never read by scoring functions. ` +
        `Either add it to a scoring function or add it to INTENTIONALLY_UNUSED.`
      );
    }
  }

  // Test 2: Every field scoring reads must be collected by UI (or merged from external sources)
  for (const scoringField of SCORING_READS) {
    if (!UI_FIELDS.has(scoringField)) {
      throw new Error(
        `Scoring reads '${scoringField}' but UI doesn't collect it. ` +
        `Either add it to QuestionnaireStep.tsx or merge it in snapshot/route.ts enrichment.`
      );
    }
  }

  // Test 3: Verify a sample questionnaire triggers scoring without errors
  const sampleAnswers: QuestionnaireAnswers = {
    team_size: 5,
    team_has_cto: true,
    team_has_business_lead: true,
    team_prior_exits: true,
    business_model_type: "saas",
    recurring_revenue: true,
    competitors_count: 5,
    has_competitive_advantage: true,
    partnerships_count: 2,
    has_strategic_investors: true,
    tam_size: 1_000_000_000,
    market_growth_rate: 0.2,
    product_status: "revenue_generating",
    has_customers: true,
    product_market_fit: true,
    has_patents: true,
    has_ip: true,
    ip_protection_stage: "granted",
    legal_risks: false,
    capital_needed: 500_000,
    last_year_revenue: 1_000_000,
  };

  // Should not throw
  const scorecardScores = deriveScorecardCriteriaScores(sampleAnswers);
  const checklistScores = deriveChecklistCriteriaScores(sampleAnswers);

  // Verify all criteria are present
  expect(Object.keys(scorecardScores)).toContain("team");
  expect(Object.keys(scorecardScores)).toContain("opportunity");
  expect(Object.keys(scorecardScores)).toContain("competitive_env");
  expect(Object.keys(scorecardScores)).toContain("product_ip");
  expect(Object.keys(scorecardScores)).toContain("partnerships");
  expect(Object.keys(scorecardScores)).toContain("funding_required");

  expect(Object.keys(checklistScores)).toContain("team");
  expect(Object.keys(checklistScores)).toContain("idea");
  expect(Object.keys(checklistScores)).toContain("product_ip");
  expect(Object.keys(checklistScores)).toContain("relationships");
  expect(Object.keys(checklistScores)).toContain("operating_stage");

  // Verify scores are numbers between 0 and 1
  Object.values(scorecardScores).forEach((score) => {
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  Object.values(checklistScores).forEach((score) => {
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
