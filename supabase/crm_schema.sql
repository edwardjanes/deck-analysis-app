-- ============================================================
-- INVESTOR CRM SCHEMA
-- Run this in the Supabase SQL editor
-- ============================================================

-- ---- 0. ADD CRM ACCESS TO PROFILES ----

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crm_access boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crm_whop_membership_id text;


-- ---- 1. GLOBAL INVESTOR DATABASE (Source Capital-maintained) ----

CREATE TABLE IF NOT EXISTS investor_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  -- Identity
  fund_name           text NOT NULL,
  contact_name        text,
  role                text,
  email               text,
  linkedin_url        text,
  website             text,

  -- Investment profile
  stage_focus         text[],
  geography           text[],
  sector_focus        text[],
  check_size_min      integer,
  check_size_max      integer,
  thesis_notes        text,

  -- Source Capital metadata
  verified            boolean NOT NULL DEFAULT false,
  source              text DEFAULT 'manual',
  last_verified_at    timestamptz,

  -- Full-text search
  search_vector       tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(fund_name, '') || ' ' ||
      coalesce(contact_name, '') || ' ' ||
      coalesce(thesis_notes, '') || ' ' ||
      coalesce(array_to_string(sector_focus, ' '), '') || ' ' ||
      coalesce(array_to_string(stage_focus, ' '), '')
    )
  ) STORED
);

CREATE INDEX IF NOT EXISTS investor_profiles_search_idx ON investor_profiles USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS investor_profiles_stage_idx ON investor_profiles USING GIN(stage_focus);
CREATE INDEX IF NOT EXISTS investor_profiles_geo_idx ON investor_profiles USING GIN(geography);
CREATE INDEX IF NOT EXISTS investor_profiles_sector_idx ON investor_profiles USING GIN(sector_focus);

ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can view investor database" ON investor_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.crm_access = true
    )
  );


-- ---- 2. FOUNDER PIPELINE ----

CREATE TABLE IF NOT EXISTS pipeline_investors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link to global DB (optional — null if manually added)
  investor_profile_id uuid REFERENCES investor_profiles(id) ON DELETE SET NULL,

  -- Investor details (copied at add-time, independent of global DB)
  fund_name           text NOT NULL,
  contact_name        text,
  role                text,
  email               text,
  linkedin_url        text,
  stage_focus         text[],
  geography           text[],
  sector_focus        text[],
  check_size_min      integer,
  check_size_max      integer,
  thesis_notes        text,

  -- Pipeline state
  stage               text NOT NULL DEFAULT 'researching'
    CONSTRAINT valid_stage CHECK (stage IN (
      'researching', 'targeted', 'reached_out', 'replied',
      'meeting_scheduled', 'meeting_completed', 'follow_up',
      'due_diligence', 'term_sheet', 'committed', 'passed'
    )),

  -- Founder's private notes
  personal_notes      text,

  -- Follow-up reminder
  next_follow_up_date date,
  follow_up_note      text,

  -- Soft delete
  archived            boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS pipeline_investors_user_id_idx ON pipeline_investors(user_id);
CREATE INDEX IF NOT EXISTS pipeline_investors_stage_idx ON pipeline_investors(user_id, stage);
CREATE INDEX IF NOT EXISTS pipeline_investors_follow_up_idx
  ON pipeline_investors(user_id, next_follow_up_date)
  WHERE next_follow_up_date IS NOT NULL AND archived = false;

ALTER TABLE pipeline_investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pipeline" ON pipeline_investors
  FOR ALL USING (auth.uid() = user_id);


-- ---- 3. TOUCHPOINTS / INTERACTION LOG ----

CREATE TABLE IF NOT EXISTS touchpoints (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz DEFAULT now(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pipeline_investor_id  uuid NOT NULL REFERENCES pipeline_investors(id) ON DELETE CASCADE,

  type                  text NOT NULL
    CONSTRAINT valid_touchpoint_type CHECK (type IN (
      'email_sent', 'email_received', 'call', 'meeting',
      'note', 'follow_up_scheduled', 'intro_requested',
      'intro_made', 'linkedin_message', 'document_shared', 'other'
    )),

  subject               text,
  body                  text,
  occurred_at           timestamptz NOT NULL DEFAULT now(),

  -- Email integration metadata (Phase 2)
  external_message_id   text,
  thread_id             text,
  email_opened          boolean,
  email_replied         boolean
);

CREATE INDEX IF NOT EXISTS touchpoints_pipeline_investor_idx
  ON touchpoints(pipeline_investor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS touchpoints_user_idx ON touchpoints(user_id);

ALTER TABLE touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own touchpoints" ON touchpoints
  FOR ALL USING (auth.uid() = user_id);


-- ---- 4. UPDATED_AT TRIGGERS ----

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pipeline_investors_updated_at
  BEFORE UPDATE ON pipeline_investors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER investor_profiles_updated_at
  BEFORE UPDATE ON investor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
