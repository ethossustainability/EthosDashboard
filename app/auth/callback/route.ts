import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

type CookieToSet = {
  name: string;
  value: string;
  options?: object;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/home';
  const safeNext = next.startsWith('/') ? next : '/home';
  const forwardedHost = req.headers.get('x-forwarded-host');
  const origin = forwardedHost ? `https://${forwardedHost}` : new URL(req.url).origin;

  let exchangeError: string | null = null;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error?.message ?? null;
    console.log('Code exchange:', error?.message ?? 'success', 'user:', data?.user?.email ?? 'none');
  }

  const response = NextResponse.redirect(`${origin}${exchangeError ? '/login?error=auth' : safeNext}`);
  response.headers.set('Cache-Control', 'no-store');

  return response;
}
