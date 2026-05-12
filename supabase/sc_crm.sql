-- ============================================================
-- SOURCE CAPITAL INTERNAL SALES CRM
-- Run in Supabase SQL editor
-- ============================================================

-- ---- 0. SC ADMIN FLAG ON PROFILES ----

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sc_admin boolean NOT NULL DEFAULT false;


-- ---- 1. PROSPECTS ----

CREATE TABLE IF NOT EXISTS sc_prospects (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),

  -- Identity
  first_name            text NOT NULL,
  last_name             text,
  email                 text,
  linkedin_url          text,
  company_name          text,
  role                  text,
  location              text,

  -- Funnel stage
  stage                 text NOT NULL DEFAULT 'connection_request'
    CONSTRAINT sc_valid_stage CHECK (stage IN (
      'connection_request',
      'engaged',
      'call_booked',
      'call_completed',
      'follow_up',
      'sale',
      'lost'
    )),

  -- Lead intelligence
  lead_score            integer CHECK (lead_score >= 0 AND lead_score <= 100),
  lead_score_rationale  text,
  lead_score_updated_at timestamptz,

  -- Follow-up scheduling
  next_follow_up_date   date,
  follow_up_note        text,

  -- Source metadata
  source                text DEFAULT 'linkedin',
  hubspot_id            text,

  -- Private notes
  notes                 text,

  archived              boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS sc_prospects_stage_idx        ON sc_prospects(stage) WHERE archived = false;
CREATE INDEX IF NOT EXISTS sc_prospects_follow_up_idx    ON sc_prospects(next_follow_up_date) WHERE next_follow_up_date IS NOT NULL AND archived = false;
CREATE INDEX IF NOT EXISTS sc_prospects_email_idx        ON sc_prospects(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS sc_prospects_linkedin_idx     ON sc_prospects(linkedin_url) WHERE linkedin_url IS NOT NULL;

ALTER TABLE sc_prospects ENABLE ROW LEVEL SECURITY;

-- SC admins can read/write; regular users have no access
CREATE POLICY "SC admins can manage prospects" ON sc_prospects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.sc_admin = true
    )
  );

-- Updated-at trigger
CREATE OR REPLACE FUNCTION sc_prospects_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sc_prospects_updated_at
  BEFORE UPDATE ON sc_prospects
  FOR EACH ROW EXECUTE FUNCTION sc_prospects_updated_at();


-- ---- 2. TOUCHPOINTS ----

CREATE TABLE IF NOT EXISTS sc_touchpoints (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz DEFAULT now(),
  prospect_id           uuid NOT NULL REFERENCES sc_prospects(id) ON DELETE CASCADE,

  type                  text NOT NULL
    CONSTRAINT sc_valid_touchpoint_type CHECK (type IN (
      'linkedin_connection',
      'linkedin_message_sent',
      'linkedin_message_received',
      'email_sent',
      'email_received',
      'call',
      'note',
      'follow_up'
    )),

  subject               text,
  body                  text,
  occurred_at           timestamptz NOT NULL DEFAULT now(),

  -- Fathom call integration
  fathom_recording_url  text,
  fathom_transcript     text,
  call_duration_mins    integer,

  -- Gmail integration (Phase 2)
  gmail_message_id      text,
  gmail_thread_id       text,
  email_opened          boolean,
  email_replied         boolean,

  -- AI-generated suggestions
  ai_follow_up_suggestion text,
  ai_suggested_at         timestamptz
);

CREATE INDEX IF NOT EXISTS sc_touchpoints_prospect_idx
  ON sc_touchpoints(prospect_id, occurred_at DESC);

ALTER TABLE sc_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SC admins can manage touchpoints" ON sc_touchpoints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.sc_admin = true
    )
  );


-- ---- 3. HELPER: grant sc_admin by email ----
-- UPDATE profiles SET sc_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = 'you@sourcecapital.co.uk');