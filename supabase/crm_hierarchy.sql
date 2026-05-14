-- ============================================================
-- INVESTOR HIERARCHY MIGRATION
-- Splits flat investor_profiles into:
--   investor_firms    (business-level: VCs, Family Offices, etc.)
--   investor_contacts (individual-level: employees/partners)
-- Run this in the Supabase SQL editor AFTER crm_schema.sql
-- ============================================================


-- ---- 1. INVESTOR FIRMS ----

CREATE TABLE IF NOT EXISTS investor_firms (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  -- Identity
  name                text NOT NULL,
  type                text NOT NULL DEFAULT 'vc'
    CONSTRAINT valid_firm_type CHECK (type IN (
      'vc', 'family_office', 'angel_network', 'accelerator',
      'corporate_vc', 'syndicate', 'debt_fund', 'other'
    )),
  website             text,
  description         text,

  -- Investment profile
  stage_focus         text[] DEFAULT '{}',
  geography           text[] DEFAULT '{}',
  sector_focus        text[] DEFAULT '{}',
  check_size_min      integer,
  check_size_max      integer,
  thesis_notes        text,

  -- Source Capital metadata
  verified            boolean NOT NULL DEFAULT false,
  source              text DEFAULT 'manual',
  last_verified_at    timestamptz,

  -- Full-text search
  search_vector       tsvector
);

CREATE INDEX IF NOT EXISTS investor_firms_search_idx   ON investor_firms USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS investor_firms_stage_idx    ON investor_firms USING GIN(stage_focus);
CREATE INDEX IF NOT EXISTS investor_firms_geo_idx      ON investor_firms USING GIN(geography);
CREATE INDEX IF NOT EXISTS investor_firms_sector_idx   ON investor_firms USING GIN(sector_focus);
CREATE INDEX IF NOT EXISTS investor_firms_type_idx     ON investor_firms(type);

ALTER TABLE investor_firms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users can view investor firms" ON investor_firms;
CREATE POLICY "CRM users can view investor firms" ON investor_firms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.crm_access = true
    )
  );

-- Search vector trigger
CREATE OR REPLACE FUNCTION investor_firms_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.thesis_notes, '') || ' ' ||
    coalesce(array_to_string(NEW.sector_focus, ' '), '') || ' ' ||
    coalesce(array_to_string(NEW.stage_focus, ' '), '') || ' ' ||
    coalesce(array_to_string(NEW.geography, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS investor_firms_search_vector_trigger ON investor_firms;
CREATE TRIGGER investor_firms_search_vector_trigger
  BEFORE INSERT OR UPDATE ON investor_firms
  FOR EACH ROW EXECUTE FUNCTION investor_firms_search_vector();

DROP TRIGGER IF EXISTS investor_firms_updated_at ON investor_firms;
CREATE TRIGGER investor_firms_updated_at
  BEFORE UPDATE ON investor_firms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ---- 2. INVESTOR CONTACTS ----

CREATE TABLE IF NOT EXISTS investor_contacts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  -- Link to firm (nullable — solo angels may have no firm)
  investor_firm_id    uuid REFERENCES investor_firms(id) ON DELETE SET NULL,

  -- Identity
  first_name          text NOT NULL,
  last_name           text,
  role                text,          -- e.g. "Partner", "Associate", "MD"
  email               text,
  linkedin_url        text,
  phone               text,
  location            text,          -- city/country level

  -- Notes
  bio                 text,
  notes               text,

  -- Source Capital metadata
  verified            boolean NOT NULL DEFAULT false,
  source              text DEFAULT 'manual',

  -- Full-text search
  search_vector       tsvector
);

CREATE INDEX IF NOT EXISTS investor_contacts_firm_idx    ON investor_contacts(investor_firm_id);
CREATE INDEX IF NOT EXISTS investor_contacts_search_idx  ON investor_contacts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS investor_contacts_email_idx   ON investor_contacts(email) WHERE email IS NOT NULL;

ALTER TABLE investor_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users can view investor contacts" ON investor_contacts;
CREATE POLICY "CRM users can view investor contacts" ON investor_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.crm_access = true
    )
  );

-- Search vector trigger
CREATE OR REPLACE FUNCTION investor_contacts_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.first_name, '') || ' ' ||
    coalesce(NEW.last_name, '') || ' ' ||
    coalesce(NEW.role, '') || ' ' ||
    coalesce(NEW.bio, '') || ' ' ||
    coalesce(NEW.notes, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS investor_contacts_search_vector_trigger ON investor_contacts;
CREATE TRIGGER investor_contacts_search_vector_trigger
  BEFORE INSERT OR UPDATE ON investor_contacts
  FOR EACH ROW EXECUTE FUNCTION investor_contacts_search_vector();

DROP TRIGGER IF EXISTS investor_contacts_updated_at ON investor_contacts;
CREATE TRIGGER investor_contacts_updated_at
  BEFORE UPDATE ON investor_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ---- 3. UPDATE PIPELINE_INVESTORS ----
-- Add FK columns pointing to the new tables.
-- The old denormalized fields (fund_name, contact_name, etc.) are KEPT
-- so existing pipeline entries don't lose data.

ALTER TABLE pipeline_investors
  ADD COLUMN IF NOT EXISTS investor_firm_id    uuid REFERENCES investor_firms(id)    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS investor_contact_id uuid REFERENCES investor_contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pipeline_investors_firm_idx    ON pipeline_investors(investor_firm_id)    WHERE investor_firm_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS pipeline_investors_contact_idx ON pipeline_investors(investor_contact_id) WHERE investor_contact_id IS NOT NULL;

-- ---- 4. PORTFOLIO COMPANIES: link to firm too ----
-- Portfolio companies belong to a firm, not just a pipeline entry.

ALTER TABLE portfolio_companies
  ADD COLUMN IF NOT EXISTS investor_firm_id uuid REFERENCES investor_firms(id) ON DELETE SET NULL;
