import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { chatId } = await req.json();

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if chat exists and belongs to user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: chat, error: chatError } = await (supabase.from('chats') as any)
      .select('id, is_shared, share_id')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    // If already shared, return the existing share_id
    if (chat.is_shared && chat.share_id) {
      return NextResponse.json({ shareId: chat.share_id });
    }

    // Otherwise, generate a new share_id and mark as shared
    const shareId = nanoid(10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('chats') as any)
      .update({ is_shared: true, share_id: shareId })
      .eq('id', chatId);

    if (updateError) {
      console.error('Failed to update chat sharing status:', updateError);
      return NextResponse.json({ error: 'Failed to share chat' }, { status: 500 });
    }

    return NextResponse.json({ shareId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Share Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
