import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import type { Chapter } from '@/types/chapters';
import type { ProjectType } from '@/types/projects';
import { CreateProjectWizard } from '@/components/lead/project-wizard/CreateProjectWizard';
import { decodeRoleId } from '@/lib/decode-role';

type ChapterOption = Pick<Chapter, 'chapter_id' | 'name' | 'is_hq' | 'location'>;

function decodeChapterId(accessToken: string) {
  const payload = accessToken.split('.')[1];
  if (!payload) return '';

  const parsed = JSON.parse(atob(payload)) as unknown;
  if (!parsed || typeof parsed !== 'object' || !('chapter_id' in parsed)) return '';

  return String(parsed.chapter_id ?? '');
}

export default async function NewProjectPage() {
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
  const chapterId = decodeChapterId(session.access_token);

  if (roleId !== 2 && roleId !== 3) {
    redirect('/home');
  }

  const [{ data: chaptersData }, { data: projectTypesData }] = await Promise.all([
    supabase
      .from('chapters')
      .select('chapter_id, name, is_hq, location')
      .order('name', { ascending: true }),
    supabase
      .from('project_types')
      .select('type_id, type_name')
      .order('type_id', { ascending: true }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      <CreateProjectWizard
        chapters={(chaptersData ?? []) as ChapterOption[]}
        projectTypes={(projectTypesData ?? []) as ProjectType[]}
        isBoard={roleId === 3}
        currentChapterId={chapterId}
      />
    </div>
  );
}
