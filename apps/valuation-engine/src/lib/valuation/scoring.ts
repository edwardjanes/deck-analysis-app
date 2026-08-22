import {
  ScorecardCriterionKey,
  ChecklistCriterionKey,
  QuestionnaireAnswers,
} from './types';

export function deriveScorecardCriteriaScores(
  answers: QuestionnaireAnswers
): Record<ScorecardCriterionKey, number> {
  // NOTE: This rubric is ILLUSTRATIVE and an assumption.
  // Equidam's exact sub-trait weighting is proprietary.
  // Users can override these scores directly in the UI.

  const team = scoreTeamStrength(answers);
  const opportunity = scoreOpportunitySize(answers);
  const competitive_env = scoreCompetitiveEnvironment(answers);
  const product_ip = scoreProductStrength(answers);
  const partnerships = scoreStrategicPartnerships(answers);
  const funding_required = scoreFundingRequired(answers);

  return {
    team,
    opportunity,
    competitive_env,
    product_ip,
    partnerships,
    funding_required,
  };
}

export function deriveChecklistCriteriaScores(
  answers: QuestionnaireAnswers
): Record<ChecklistCriterionKey, number> {
  // NOTE: This rubric is ILLUSTRATIVE and an assumption.
  // Users can override these scores directly in the UI.

  const team = scoreTeamQuality(answers);
  const idea = scoreIdeaQuality(answers);
  const product_ip = scoreProductIP(answers);
  const relationships = scoreRelationships(answers);
  const operating_stage = scoreOperatingStage(answers);

  return {
    team,
    idea,
    product_ip,
    relationships,
    operating_stage,
  };
}

function scoreTeamStrength(answers: QuestionnaireAnswers): number {
  let score = 0;
  let count = 0;

  if (answers.team_size) {
    score += answers.team_size >= 5 ? 0.5 : answers.team_size >= 3 ? 0.25 : 0;
    count++;
  }
  if (answers.team_has_cto) {
    score += answers.team_has_cto ? 0.5 : 0;
    count++;
  }
  if (answers.team_has_business_lead) {
    score += answers.team_has_business_lead ? 0.5 : 0;
    count++;
  }
  if (answers.team_prior_exits) {
    score += answers.team_prior_exits ? 0.75 : 0;
    count++;
  }

  return count > 0 ? score / count : 0;
}

function scoreOpportunitySize(answers: QuestionnaireAnswers): number {
  let score = 0;
  let count = 0;

  if (answers.tam_size) {
    const tam = answers.tam_size;
    score += tam > 10_000_000_000 ? 1.0 : tam > 1_000_000_000 ? 0.75 : tam > 100_000_000 ? 0.5 : 0.25;
    count++;
  }
  if (answers.market_growth_rate) {
    const growth = answers.market_growth_rate;
    score += growth > 0.2 ? 1.0 : growth > 0.1 ? 0.75 : growth > 0.05 ? 0.5 : 0.25;
    count++;
  }
  if (answers.recurring_revenue !== undefined) {
    score += answers.recurring_revenue ? 0.75 : 0.4;
    count++;
  }
  if (answers.has_customers !== undefined) {
    score += answers.has_customers ? 0.75 : 0.25;
    count++;
  }
  if (answers.product_market_fit !== undefined) {
    score += answers.product_market_fit ? 1.0 : 0.25;
    count++;
  }

  return count > 0 ? Math.min(score / count, 1.0) : 0;
}

function scoreCompetitiveEnvironment(answers: QuestionnaireAnswers): number {
  let score = 0;
  let count = 0;

  if (answers.competitors_count !== undefined) {
    score += answers.competitors_count <= 3 ? 0.75 : answers.competitors_count <= 10 ? 0.5 : 0.25;
    count++;
  }
  if (answers.has_competitive_advantage) {
    score += answers.has_competitive_advantage ? 0.75 : 0.25;
    count++;
  }

  return count > 0 ? Math.min(score / count, 1.0) : 0;
}

function scoreProductStrength(answers: QuestionnaireAnswers): number {
  let score = 0;
  let count = 0;

  if (answers.product_status) {
    const status = answers.product_status;
    score +=
      status === 'revenue_generating'
        ? 1.0
        : status === 'beta'
          ? 0.5
          : status === 'mvp'
            ? 0.25
            : 0;
    count++;
  }
  // Use graded IP protection stage if available, fall back to boolean logic
  if (answers.ip_protection_stage) {
    const ipScore = { none: 0.1, pending: 0.5, granted: 0.85, enforced: 1.0 }[answers.ip_protection_stage as string];
    if (ipScore !== undefined) {
      score += ipScore;
      count++;
    }
  } else if (answers.has_patents || answers.has_ip) {
    score += (answers.has_patents || answers.has_ip) ? 0.75 : 0.25;
    count++;
  }
  // Legal risks reduce score (penalty, not a separate criterion)
  if (answers.legal_risks) {
    score -= 0.25;
  }
  // Note: business_model_type is collected by UI but intentionally not scored — no defensible ranking (SaaS vs Marketplace, etc)

  return count > 0 ? Math.max(0, Math.min(score / count, 1.0)) : 0;
}

function scoreStrategicPartnerships(answers: QuestionnaireAnswers): number {
  let score = 0;
  let count = 0;

  if (answers.partnerships_count !== undefined) {
    score += answers.partnerships_count >= 3 ? 0.75 : answers.partnerships_count >= 1 ? 0.5 : 0.25;
    count++;
  }
  if (answers.has_strategic_investors) {
    score += answers.has_strategic_investors ? 0.75 : 0;
    count++;
  }

  return count > 0 ? Math.min(score / count, 1.0) : 0;
}

function scoreFundingRequired(answers: QuestionnaireAnswers): number {
  let score = 0.5;
  let count = 1;

  if (answers.capital_needed) {
    const capital = answers.capital_needed;
    const revenue = answers.last_year_revenue || 100_000;
    const ratio = capital / revenue;

    if (ratio < 0.5) score += 0.5;
    else if (ratio < 1.0) score += 0.25;
    count++;
  }

  return count > 0 ? Math.min(score / count, 1.0) : 0.5;
}

function scoreTeamQuality(answers: QuestionnaireAnswers): number {
  return scoreTeamStrength(answers);
}

function scoreIdeaQuality(answers: QuestionnaireAnswers): number {
  return scoreOpportunitySize(answers);
}

function scoreProductIP(answers: QuestionnaireAnswers): number {
  return scoreProductStrength(answers);
}

function scoreRelationships(answers: QuestionnaireAnswers): number {
  return scoreStrategicPartnerships(answers);
}

function scoreOperatingStage(answers: QuestionnaireAnswers): number {
  if (answers.product_status) {
    const status = answers.product_status;
    return status === 'revenue_generating' ? 1.0 : status === 'beta' ? 0.5 : status === 'mvp' ? 0.25 : 0;
  }
  return 0;
}
