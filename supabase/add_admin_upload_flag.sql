-- Add is_admin_upload flag to deck_submissions
-- Run in Supabase SQL editor

ALTER TABLE deck_submissions
ADD COLUMN IF NOT EXISTS is_admin_upload boolean NOT NULL DEFAULT false;

-- Index for filtering admin uploads
CREATE INDEX IF NOT EXISTS deck_submissions_is_admin_upload_idx
ON deck_submissions(is_admin_upload) WHERE is_admin_upload = true;
