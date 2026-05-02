-- Deck Analysis App — Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Main submissions table
create table deck_submissions (
  id              uuid default gen_random_uuid() primary key,
  created_at      timestamp with time zone default now(),

  -- Lead details (captured in modal)
  first_name      text not null,
  last_name       text not null,
  email           text not null,

  -- Business details (captured on upload page)
  business_name   text not null,
  website         text,
  country         text not null,

  -- File
  deck_file_path  text,                         -- path within 'decks' storage bucket

  -- Analysis state
  status          text not null default 'pending',  -- pending | analysing | complete | error

  -- Analysis results
  score           numeric(3,1),   -- Meeting Conversion Score: 1–10 (e.g. 7.5)
  verdict         text,
  verdict_type    text,                         -- pass | review | flag
  most_damaging_issue text,
  best_asset      text,
  analysis_summary text,
  analysis_json   jsonb,                        -- full structured analysis from Claude
  error_message   text
);

-- Index for polling
create index deck_submissions_status_idx on deck_submissions(status);
create index deck_submissions_email_idx on deck_submissions(email);

-- Row Level Security
alter table deck_submissions enable row level security;

-- Service role has full access (used by API routes via admin client)
-- No public access — all operations go through server-side API routes

-- Storage bucket (create via Supabase dashboard or CLI)
-- Bucket name: decks
-- Visibility: private
-- Allowed MIME types: application/pdf
-- Max file size: 20971520 (20MB)

-- To create the bucket via SQL (requires storage extension):
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values ('decks', 'decks', false, 20971520, array['application/pdf'])
-- on conflict do nothing;
