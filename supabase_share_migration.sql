-- Add sharing columns to chats table
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS share_id text UNIQUE;

-- Allow anyone to read shared chats
CREATE POLICY "Anyone can view shared chats" ON public.chats FOR SELECT USING (is_shared = true);

-- Allow anyone to read messages of shared chats
CREATE POLICY "Anyone can view messages of shared chats" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chats WHERE id = messages.chat_id AND is_shared = true)
);
