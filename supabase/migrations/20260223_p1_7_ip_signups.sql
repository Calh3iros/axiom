-- P1.7 Migration: IP signup tracking table for anti-abuse
-- Executed on Supabase Dashboard: 2026-02-23

CREATE TABLE IF NOT EXISTS ip_signups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip text NOT NULL,
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ip_signups_ip
ON ip_signups (ip);

ALTER TABLE ip_signups ENABLE ROW LEVEL SECURITY;

-- No RLS SELECT policy — only service_role can read/write
-- This prevents users from seeing other users' IP data
