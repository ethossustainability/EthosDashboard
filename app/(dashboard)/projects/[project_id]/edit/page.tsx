import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import type { Project } from '@/types/projects';
import type { ProjectRole } from '@/types/project-roles';
import type { Shift } from '@/types/shifts';
import { EditProjectForm } from '@/components/lead/EditProjectForm';

type EditProjectPageProps = {
  params: Promise<{ project_id: string }>;
};

function decodeRoleId(accessToken: string) {
  const payload = accessToken.split('.')[1];
  if (!payload) return 1;

  const parsed = JSON.parse(atob(payload)) as unknown;
  if (!parsed || typeof parsed !== 'object' || !('org_role_id' in parsed)) return 1;

  return Number(parsed.org_role_id);
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { project_id: projectId } = await params;
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

  const roleId = decodeRoleId(session.access_token);

  if (roleId !== 2 && roleId !== 3) {
    redirect('/home');
  }

  const [projectResult, shiftsResult, rolesResult] = await Promise.all([
    supabase.from('projects').select('*').eq('project_id', projectId).maybeSingle(),
    supabase
      .from('shifts')
      .select('*')
      .eq('project_id', projectId)
      .order('start_datetime', { ascending: true }),
    supabase
      .from('project_roles')
      .select('*')
      .eq('project_id', projectId)
      .order('role_name', { ascending: true }),
  ]);

  const project = projectResult.data as Project | null;

  if (!project) {
    redirect('/home');
  }

  const isBoard = roleId === 3;
  const isLead = roleId === 2 && project.created_by === session.user.id;

  if (!isBoard && !isLead) {
    redirect('/home');
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      <EditProjectForm
        project={project}
        shifts={(shiftsResult.data ?? []) as Shift[]}
        roles={(rolesResult.data ?? []) as ProjectRole[]}
      />
    </div>
  );
}
