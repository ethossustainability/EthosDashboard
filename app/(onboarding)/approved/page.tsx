import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { Button } from '@/components/ui/Button';

type ApprovedApplication = {
  projects:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

type CurrentUser = {
  first_name: string;
};

function getProjectName(application: ApprovedApplication | null) {
  const project = Array.isArray(application?.projects)
    ? application?.projects[0]
    : application?.projects;

  return project?.name ?? 'Your project';
}

export default async function ApprovedPage() {
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

  const [{ data: userData }, { data: applicationData }] = await Promise.all([
    supabase
      .from('users')
      .select('first_name')
      .eq('user_id', session.user.id)
      .single(),
    supabase
      .from('applications')
      .select('projects(name)')
      .eq('user_id', session.user.id)
      .eq('status', 'Approved')
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const user = userData as CurrentUser | null;
  const application = applicationData as ApprovedApplication | null;

  return (
    <div className="flex min-h-full items-center justify-center px-8 py-10">
      <section className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-espresso">
          Welcome to Ethos, {user?.first_name ?? 'friend'}!
        </h1>

        <p className="mt-4 text-sm leading-6 text-warm-gray">
          Your member home, project updates, files, and team tools are now unlocked.
        </p>

        <div className="mt-6 rounded-xl bg-peach-light p-4 text-sm font-semibold text-espresso">
          {getProjectName(application)}
        </div>

        <Link href="/home" className="mx-auto mt-8 block max-w-xs">
          <Button variant="primary" className="w-full">
            Go to your home page
          </Button>
        </Link>
      </section>
    </div>
  );
}
