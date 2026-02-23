-- P1.1 Migration: Add learns column + usage_log table
-- Executed on Supabase Dashboard: 2026-02-23

-- 1. Add 'learns' column to usage table
ALTER TABLE usage ADD COLUMN IF NOT EXISTS learns integer DEFAULT 0;

-- 2. Create usage_log table (for Elite throttle tracking)
CREATE TABLE IF NOT EXISTS usage_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  type text NOT NULL,
  amount integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- 3. Index for efficient throttle queries
CREATE INDEX IF NOT EXISTS idx_usage_log_user_type_time 
ON usage_log (user_id, type, created_at DESC);

-- 4. RLS
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own logs" ON usage_log
  FOR SELECT USING (auth.uid()::text = user_id);
