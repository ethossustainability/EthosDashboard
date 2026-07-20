import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { BudgetRequestsPanel } from '@/components/board/BudgetRequestsPanel';

type BudgetProjectRow = {
  project_id: string;
  name: string;
  description: string;
  requested_budget: number;
  allocated_budget: number | null;
  created_at: string;
  chapters:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  users:
    | {
        first_name: string;
        last_name: string;
      }
    | {
        first_name: string;
        last_name: string;
      }[]
    | null;
};

function getChapterName(project: BudgetProjectRow) {
  const chapter = Array.isArray(project.chapters) ? project.chapters[0] : project.chapters;
  return chapter?.name ?? 'Unknown chapter';
}

function getLeadName(project: BudgetProjectRow) {
  const lead = Array.isArray(project.users) ? project.users[0] : project.users;
  return lead ? `${lead.first_name} ${lead.last_name}` : 'Unknown lead';
}

export default async function BoardBudgetPage() {
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

  const { data } = await supabase
    .from('projects')
    .select(`
      project_id,
      name,
      description,
      requested_budget,
      allocated_budget,
      created_at,
      chapters(name),
      users!projects_created_by_fkey(first_name, last_name)
    `)
    .not('requested_budget', 'is', null)
    .order('created_at', { ascending: true });

  const projects = ((data ?? []) as BudgetProjectRow[])
    .map((project) => ({
      project_id: project.project_id,
      name: project.name,
      description: project.description,
      chapter_name: getChapterName(project),
      lead_name: getLeadName(project),
      requested_budget: project.requested_budget,
      allocated_budget: project.allocated_budget,
      created_at: project.created_at,
    }))
    .sort((a, b) => {
      if (a.allocated_budget === null && b.allocated_budget !== null) return -1;
      if (a.allocated_budget !== null && b.allocated_budget === null) return 1;
      return a.created_at.localeCompare(b.created_at);
    });

  return <BudgetRequestsPanel projects={projects} />;
}
