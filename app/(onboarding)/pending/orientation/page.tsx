import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import type { ApiResponse } from '@/types/api';
import type { Onboarding, OrientationProgress } from '@/types/onboarding';
import { OrientationPlayer } from '@/components/onboarding/OrientationPlayer';

const emptyProgress: OrientationProgress = {
  welcome: false,
  safety: false,
  how_we_work: false,
  faqs: false,
};

export default async function OrientationPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          return;
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const host = headerStore.get('host');

  if (!host) {
    redirect('/pending');
  }

  const onboardingResponse = await fetch(`${protocol}://${host}/api/onboarding/me`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: 'no-store',
  });

  const onboardingBody = (await onboardingResponse.json()) as ApiResponse<Onboarding>;

  if (!onboardingBody.data) {
    redirect('/pending');
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      <header className="mb-8">
        <p className="text-sm font-semibold text-warm-gray">Orientation</p>
        <h1 className="mt-2 text-3xl font-bold text-espresso">Learn the Ethos basics</h1>
      </header>

      <OrientationPlayer initialProgress={onboardingBody.data.orientation_progress ?? emptyProgress} />
    </div>
  );
}
