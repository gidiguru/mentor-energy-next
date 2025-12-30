import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user profile exists, if not redirect to complete signup
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        // User needs to complete their profile
        // Upsert user data
        await supabase.from('users').upsert({
          id: data.user.id,
          email: data.user.email,
          first_name: data.user.user_metadata?.full_name?.split(' ')[0] || null,
          last_name: data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
          profile_picture: data.user.user_metadata?.avatar_url || null,
        });

        return NextResponse.redirect(`${origin}/auth/complete-signup`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Return to auth page on error
  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate`);
}
