-- Run this in your Supabase SQL Editor
ALTER TABLE deck_submissions
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whop_order_id text;
