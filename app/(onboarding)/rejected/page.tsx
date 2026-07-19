import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { Button } from '@/components/ui/Button';

type RejectedApplication = {
  rejection_reason: string | null;
};

export default async function RejectedPage() {
  const cookieStore = await cookies();

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

  const { data } = await supabase
    .from('applications')
    .select('rejection_reason')
    .eq('user_id', session.user.id)
    .eq('status', 'Rejected')
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const application = data as RejectedApplication | null;

  return (
    <div className="flex min-h-full items-center justify-center px-8 py-10">
      <section className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-espresso">Not quite a fit this time</h1>

        {application?.rejection_reason ? (
          <div className="mt-6 rounded-xl bg-sand p-4 text-sm leading-6 text-warm-gray">
            {application.rejection_reason}
          </div>
        ) : null}

        <p className="mt-6 text-sm leading-6 text-warm-gray">
          There are other projects that might be a great match.
        </p>

        <Link href="/projects" className="mx-auto mt-8 block max-w-xs">
          <Button variant="primary" className="w-full">
            Browse other projects
          </Button>
        </Link>
      </section>
    </div>
  );
}
