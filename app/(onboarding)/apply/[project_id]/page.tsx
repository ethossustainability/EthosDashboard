import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import type { ApiResponse } from '@/types/api';
import type { Project } from '@/types/projects';
import type { Shift } from '@/types/shifts';
import { ApplicationForm } from '@/components/onboarding/ApplicationForm';

type ApplyPageProps = {
  params: Promise<{
    project_id: string;
  }>;
};

type ProjectDetailResponse = Project & {
  shifts: Shift[];
};

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { project_id: projectId } = await params;
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
    redirect('/projects');
  }

  const projectResponse = await fetch(`${protocol}://${host}/api/projects/${projectId}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: 'no-store',
  });

  const projectBody = (await projectResponse.json()) as ApiResponse<ProjectDetailResponse>;

  if (!projectBody.data) {
    redirect('/projects');
  }

  const { data: user } = await supabase
    .from('users')
    .select('first_name, last_name, active_login_email')
    .eq('user_id', session.user.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-10">
      <header className="mb-8">
        <p className="text-sm font-semibold text-warm-gray">Project application</p>
        <h1 className="mt-2 text-3xl font-bold text-espresso">{projectBody.data.name}</h1>
      </header>

      <ApplicationForm
        project={projectBody.data}
        shifts={projectBody.data.shifts}
        user={{
          first_name: user?.first_name ?? '',
          last_name: user?.last_name ?? '',
          email: user?.active_login_email ?? session.user.email ?? '',
        }}
      />
    </div>
  );
}
