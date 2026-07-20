import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import type { Announcement } from '@/types/announcements';
import { AnnouncementsFeed } from '@/components/announcements/AnnouncementsFeed';

export default async function AnnouncementsPage() {
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
    .from('announcements')
    .select('*')
    .order('posted_at', { ascending: false })
    .limit(50);

  const announcements = (data ?? []) as Announcement[];
  const lastSyncedAt = announcements[0]?.synced_at ?? null;

  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-10">
      <AnnouncementsFeed announcements={announcements} lastSyncedAt={lastSyncedAt} />
    </div>
  );
}
