-- ═══════════════════════════════════════
-- PROFILES (extends auth.users)
-- ═══════════════════════════════════════
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  locale      TEXT DEFAULT 'en',
  stripe_customer_id TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════
-- SUBSCRIPTIONS (Stripe sync)
-- ═══════════════════════════════════════
CREATE TABLE public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id     TEXT,
  status              TEXT NOT NULL CHECK (status IN (
    'active','canceled','past_due','trialing','incomplete'
  )),
  current_period_end  TIMESTAMPTZ,
  cancel_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subs"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- QUERIES (usage history)
-- ═══════════════════════════════════════
CREATE TABLE public.queries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (type IN ('solve','humanize','write','learn')),
  input_text      TEXT,
  input_image_url TEXT,
  output_text     TEXT,
  model_used      TEXT,
  tokens_in       INTEGER DEFAULT 0,
  tokens_out      INTEGER DEFAULT 0,
  subject_tag     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own queries"
  ON public.queries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own queries"
  ON public.queries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_queries_user_type
  ON public.queries(user_id, type, created_at DESC);

-- ═══════════════════════════════════════
-- SUBJECTS (knowledge map)
-- ═══════════════════════════════════════
CREATE TABLE public.subjects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  mastery_pct     INTEGER DEFAULT 0 CHECK (mastery_pct BETWEEN 0 AND 100),
  queries_count   INTEGER DEFAULT 0,
  weak_topics     JSONB DEFAULT '[]',
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subjects"
  ON public.subjects FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- DAILY USAGE (rate limiting free tier)
-- ═══════════════════════════════════════
CREATE TABLE public.daily_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  solves_used     INTEGER DEFAULT 0,
  humanize_words  INTEGER DEFAULT 0,
  writes_used     INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own usage"
  ON public.daily_usage FOR ALL USING (auth.uid() = user_id);
