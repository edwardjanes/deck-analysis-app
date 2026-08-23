-- Run in Supabase SQL Editor
-- Makes email and last_name nullable so dashboard users (already logged in) don't need to re-enter them

ALTER TABLE deck_submissions
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL;
