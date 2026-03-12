-- Fix: Add 'elite' to profiles.plan CHECK constraint
-- Fix: Add stripe_subscription_id to profiles (webhook needs it)
-- Clean: Drop unused subscriptions table

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'elite'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
DROP TABLE IF EXISTS public.subscriptions;
