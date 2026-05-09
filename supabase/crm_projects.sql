-- ============================================================
-- RAISE PROJECTS SCHEMA
-- Run this in the Supabase SQL editor
-- ============================================================

-- ---- 1. RAISE PROJECTS ----

CREATE TABLE IF NOT EXISTS raise_projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  owner_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  company_name  text,
  description   text,
  target_raise  text,
  stage         text,
  status        text NOT NULL DEFAULT 'active'
    CONSTRAINT valid_project_status CHECK (status IN ('active', 'closed', 'archived'))
);

ALTER TABLE raise_projects ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Project owner full access" ON raise_projects
  FOR ALL USING (auth.uid() = owner_id);

-- Members can view
CREATE POLICY "Project members can view" ON raise_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM raise_project_members
      WHERE raise_project_members.project_id = raise_projects.id
      AND raise_project_members.user_id = auth.uid()
    )
  );

CREATE TRIGGER raise_projects_updated_at
  BEFORE UPDATE ON raise_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ---- 2. PROJECT MEMBERS ----

CREATE TABLE IF NOT EXISTS raise_project_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  project_id  uuid NOT NULL REFERENCES raise_projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'viewer'
    CONSTRAINT valid_member_role CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by  uuid REFERENCES auth.users(id),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS raise_project_members_project_idx ON raise_project_members(project_id);
CREATE INDEX IF NOT EXISTS raise_project_members_user_idx ON raise_project_members(user_id);

ALTER TABLE raise_project_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members of projects they belong to
CREATE POLICY "Members can view project membership" ON raise_project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM raise_project_members m2
      WHERE m2.project_id = raise_project_members.project_id
      AND m2.user_id = auth.uid()
    )
  );

-- Only service role can insert/update/delete (handled via API routes)
CREATE POLICY "Service role manages members" ON raise_project_members
  FOR ALL USING (auth.role() = 'service_role');


-- ---- 3. PROJECT INVITATIONS ----

CREATE TABLE IF NOT EXISTS raise_project_invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  project_id    uuid NOT NULL REFERENCES raise_projects(id) ON DELETE CASCADE,
  invited_by    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  role          text NOT NULL DEFAULT 'viewer'
    CONSTRAINT valid_invite_role CHECK (role IN ('editor', 'viewer')),
  token         text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at   timestamptz,
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(project_id, email)
);

CREATE INDEX IF NOT EXISTS raise_project_invitations_token_idx ON raise_project_invitations(token);
CREATE INDEX IF NOT EXISTS raise_project_invitations_project_idx ON raise_project_invitations(project_id);

ALTER TABLE raise_project_invitations ENABLE ROW LEVEL SECURITY;

-- Public can read invitations by token (needed for the join page)
CREATE POLICY "Public can view invitation by token" ON raise_project_invitations
  FOR SELECT USING (true);

-- Service role manages invitations
CREATE POLICY "Service role manages invitations" ON raise_project_invitations
  FOR ALL USING (auth.role() = 'service_role');


-- ---- 4. ADD raise_project_id TO pipeline_investors ----

ALTER TABLE pipeline_investors
  ADD COLUMN IF NOT EXISTS raise_project_id uuid REFERENCES raise_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pipeline_investors_project_idx ON pipeline_investors(raise_project_id);

-- Members of a project can view investors in that project
CREATE POLICY "Project members can view project investors" ON pipeline_investors
  FOR SELECT USING (
    raise_project_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM raise_project_members
      WHERE raise_project_members.project_id = pipeline_investors.raise_project_id
      AND raise_project_members.user_id = auth.uid()
    )
  );

-- Editors can update investors in their project
CREATE POLICY "Project editors can update project investors" ON pipeline_investors
  FOR UPDATE USING (
    raise_project_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM raise_project_members
      WHERE raise_project_members.project_id = pipeline_investors.raise_project_id
      AND raise_project_members.user_id = auth.uid()
      AND raise_project_members.role IN ('editor', 'owner')
    )
  );
