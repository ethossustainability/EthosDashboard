'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { ApiResponse } from '@/types/api';
import type { File } from '@/types/files';
import type { PageType } from '@/types/recents';

type RecentListItem = {
  page_type: PageType;
  reference_id: string;
  name: string | null;
  visited_at: string;
};

type RecentsResponse = {
  recents: RecentListItem[];
};

type FilesResponse = {
  files: File[];
  total: number;
  page: number;
  per_page: number;
};

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function iconFor(pageType: PageType) {
  return pageType === 'Project' ? '▣' : '□';
}

export default function RecentsPage() {
  const [recents, setRecents] = useState<RecentListItem[]>([]);
  const [filesById, setFilesById] = useState<Map<string, File>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      ),
    [],
  );

  useEffect(() => {
    async function loadRecents() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers = {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      };

      const [recentsResponse, filesResponse] = await Promise.all([
        fetch('/api/recents/me', { headers }),
        fetch('/api/files?per_page=100', { headers }),
      ]);

      if (recentsResponse.ok) {
        const body = (await recentsResponse.json()) as ApiResponse<RecentsResponse>;
        setRecents(body.data?.recents ?? []);
      }

      if (filesResponse.ok) {
        const body = (await filesResponse.json()) as ApiResponse<FilesResponse>;
        setFilesById(new Map((body.data?.files ?? []).map((file) => [file.file_id, file])));
      }

      setIsLoading(false);
    }

    void loadRecents();
  }, [supabase]);

  function openRecent(recent: RecentListItem) {
    if (recent.page_type === 'Project') {
      window.location.href = `/projects/${recent.reference_id}`;
      return;
    }

    const file = filesById.get(recent.reference_id);
    if (file?.drive_url) {
      window.open(file.drive_url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <h1 className="text-3xl font-bold text-espresso">Recents</h1>

      {isLoading ? (
        <p className="mt-8 text-sm text-warm-gray">Loading recents...</p>
      ) : recents.length > 0 ? (
        <section className="mt-8 rounded-xl border border-sand bg-cream">
          {recents.map((recent) => (
            <button
              key={`${recent.page_type}-${recent.reference_id}`}
              type="button"
              onClick={() => openRecent(recent)}
              className="flex w-full items-center gap-4 border-b border-sand px-5 py-4 text-left transition hover:bg-sand/30 last:border-b-0"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-peach-light text-sm font-bold text-espresso">
                {iconFor(recent.page_type)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-espresso">
                  {recent.name ?? 'Untitled'}
                </span>
                <span className="mt-1 block text-sm text-warm-gray">
                  {recent.page_type} · {relativeTime(recent.visited_at)}
                </span>
              </span>
            </button>
          ))}
        </section>
      ) : (
        <p className="mt-8 rounded-xl border border-sand bg-cream px-5 py-12 text-center text-sm text-warm-gray">
          No recent pages yet.
        </p>
      )}
    </div>
  );
}
