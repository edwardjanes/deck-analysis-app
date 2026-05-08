-- Add portfolio companies table for investor previous investments
CREATE TABLE IF NOT EXISTS portfolio_companies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  pipeline_investor_id uuid NOT NULL REFERENCES pipeline_investors(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name    text NOT NULL,
  website         text,
  sector          text,
  stage_at_investment text,
  year            integer,
  notes           text
);

CREATE INDEX IF NOT EXISTS portfolio_companies_investor_idx ON portfolio_companies(pipeline_investor_id);

ALTER TABLE portfolio_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own portfolio companies" ON portfolio_companies
  FOR ALL USING (auth.uid() = user_id);
