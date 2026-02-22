CREATE TABLE public.knowledge_map (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL, -- e.g., "Mathematics"
  topic text NOT NULL, -- e.g., "Integrals"
  interactions_count integer DEFAULT 1,
  mastery_score float DEFAULT 0.0, -- 0.0 to 1.0 (representing 0% to 100%)
  last_interaction_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, subject, topic)
);

-- RLS
ALTER TABLE public.knowledge_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own knowledge map" ON public.knowledge_map FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can modify knowledge map" ON public.knowledge_map USING (true);
