import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    // Delete user profile data first
    await supabaseAdmin.from('profiles').delete().eq('id', user.id);
    await supabaseAdmin.from('usage').delete().eq('user_id', user.id);
    await supabaseAdmin.from('usage_log').delete().eq('user_id', user.id);
    await supabaseAdmin.from('ip_signups').delete().eq('user_id', user.id);

    // Delete the auth user (this is irreversible)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
