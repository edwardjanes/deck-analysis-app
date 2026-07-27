-- ============================================================
-- RAISE LISTING SCHEMA (Source Capital Raise Listing)
-- Run in Supabase SQL editor after existing migrations.
-- Reuses update_updated_at() trigger fn defined in crm_schema.sql.
-- ============================================================

-- ---- 1. RAISE LISTINGS ----

CREATE TABLE IF NOT EXISTS raise_listings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),

  -- Ownership
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_submission_id    uuid REFERENCES deck_submissions(id) ON DELETE SET NULL,

  -- Public identity
  slug                  text UNIQUE,
  company_name          text NOT NULL,
  company_website       text,
  company_logo_path     text,
  one_liner             text,
  description           text,

  -- Raise details
  sector                text[] DEFAULT '{}',
  stage                 text
    CONSTRAINT valid_listing_stage CHECK (stage IS NULL OR stage IN (
      'pre_seed', 'seed', 'series_a', 'series_b', 'series_c_plus', 'bridge', 'other'
    )),
  target_raise_amount   numeric,
  currency              text NOT NULL DEFAULT 'GBP',
  raise_type            text,
  minimum_check_size    numeric,
  use_of_funds          text,
  traction_summary      text,
  pitch_deck_file_path  text,

  -- Approval workflow
  status                text NOT NULL DEFAULT 'draft'
    CONSTRAINT valid_listing_status CHECK (status IN (
      'draft', 'pending_review', 'approved', 'rejected', 'archived'
    )),
  rejection_reason      text,
  reviewed_by           uuid REFERENCES auth.users(id),
  reviewed_at           timestamptz,
  submitted_at          timestamptz,
  published_at          timestamptz,

  -- Tier / monetisation state (Phase 2+)
  tier                  text NOT NULL DEFAULT 'free'
    CONSTRAINT valid_listing_tier CHECK (tier IN ('free', 'growth', 'priority')),
  tier_expires_at       timestamptz,
  whop_membership_id    text,
  whop_order_id         text,

  -- Distribution / ranking (Phase 3+)
  featured              boolean NOT NULL DEFAULT false,
  featured_until        timestamptz,
  verified_badge        boolean NOT NULL DEFAULT false,
  boost_active_until    timestamptz,

  -- Denormalised anonymous stats
  view_count            integer NOT NULL DEFAULT 0,
  unique_viewer_count   integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS raise_listings_user_idx    ON raise_listings(user_id);
CREATE INDEX IF NOT EXISTS raise_listings_status_idx  ON raise_listings(status);
CREATE INDEX IF NOT EXISTS raise_listings_slug_idx    ON raise_listings(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS raise_listings_public_idx  ON raise_listings(status, published_at DESC) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS raise_listings_sector_idx  ON raise_listings USING GIN(sector);

ALTER TABLE raise_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved listings" ON raise_listings;
CREATE POLICY "Public can view approved listings" ON raise_listings
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Owner can manage own listing" ON raise_listings;
CREATE POLICY "Owner can manage own listing" ON raise_listings
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "SC admins can manage all listings" ON raise_listings;
CREATE POLICY "SC admins can manage all listings" ON raise_listings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.sc_admin = true)
  );

DROP TRIGGER IF EXISTS raise_listings_updated_at ON raise_listings;
CREATE TRIGGER raise_listings_updated_at
  BEFORE UPDATE ON raise_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ---- 2. TEAM MEMBERS ----

CREATE TABLE IF NOT EXISTS raise_listing_team_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  listing_id    uuid NOT NULL REFERENCES raise_listings(id) ON DELETE CASCADE,
  name          text NOT NULL,
  role          text,
  bio           text,
  linkedin_url  text,
  photo_path    text,
  order_index   integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS raise_listing_team_members_listing_idx ON raise_listing_team_members(listing_id, order_index);

ALTER TABLE raise_listing_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view team of approved listings" ON raise_listing_team_members;
CREATE POLICY "Public can view team of approved listings" ON raise_listing_team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM raise_listings WHERE raise_listings.id = listing_id AND raise_listings.status = 'approved')
  );

DROP POLICY IF EXISTS "Owner can manage own listing team" ON raise_listing_team_members;
CREATE POLICY "Owner can manage own listing team" ON raise_listing_team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM raise_listings WHERE raise_listings.id = listing_id AND raise_listings.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "SC admins can manage all listing teams" ON raise_listing_team_members;
CREATE POLICY "SC admins can manage all listing teams" ON raise_listing_team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.sc_admin = true)
  );


-- ---- 3. ENGAGEMENT EVENTS ----

CREATE TABLE IF NOT EXISTS listing_engagement_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id            uuid NOT NULL REFERENCES raise_listings(id) ON DELETE CASCADE,

  event_type            text NOT NULL
    CONSTRAINT valid_engagement_event_type CHECK (event_type IN (
      'view', 'click_website', 'click_deck', 'click_data_room',
      'click_contact', 'intro_request'
    )),

  occurred_at           timestamptz NOT NULL DEFAULT now(),

  -- Anonymous visitor tracking
  visitor_session_id    text,
  investor_contact_id   uuid REFERENCES investor_contacts(id) ON DELETE SET NULL,
  referrer              text,
  user_agent            text,
  ip_hash               text,
  metadata              jsonb
);

CREATE INDEX IF NOT EXISTS listing_engagement_events_listing_idx
  ON listing_engagement_events(listing_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS listing_engagement_events_type_idx
  ON listing_engagement_events(listing_id, event_type);

ALTER TABLE listing_engagement_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role writes engagement events" ON listing_engagement_events;
CREATE POLICY "Service role writes engagement events" ON listing_engagement_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Owner can view own listing engagement" ON listing_engagement_events;
CREATE POLICY "Owner can view own listing engagement" ON listing_engagement_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM raise_listings WHERE raise_listings.id = listing_id AND raise_listings.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "SC admins can view all engagement" ON listing_engagement_events;
CREATE POLICY "SC admins can view all engagement" ON listing_engagement_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.sc_admin = true)
  );


-- ---- 4. RPC: atomic view counter increment ----

CREATE OR REPLACE FUNCTION increment_listing_view_count(listing_id_input uuid)
RETURNS void AS $$
BEGIN
  UPDATE raise_listings
  SET view_count = view_count + 1
  WHERE id = listing_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ---- 5. STORAGE BUCKETS (run these separately via dashboard or execute-sql.js) ----
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values ('raise-listing-logos', 'raise-listing-logos', true, 5242880, array['image/png','image/jpeg','image/webp'])
-- on conflict do nothing;
--
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values ('raise-listing-decks', 'raise-listing-decks', false, 20971520, array['application/pdf'])
-- on conflict do nothing;
