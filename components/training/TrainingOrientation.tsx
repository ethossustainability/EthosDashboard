'use client';

import { useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { ApiResponse } from '@/types/api';
import type { Onboarding, OrientationProgress } from '@/types/onboarding';
import { Button } from '@/components/ui/Button';

type TrainingOrientationProps = {
  initialProgress: OrientationProgress;
};

type ChapterKey = keyof OrientationProgress;

type Chapter = {
  key: ChapterKey;
  title: string;
};

const chapters: Chapter[] = [
  { key: 'welcome', title: 'Welcome to Ethos' },
  { key: 'safety', title: 'Project safety' },
  { key: 'how_we_work', title: 'How we work' },
  { key: 'faqs', title: 'FAQs' },
];

function Checkmark({ completed }: { completed: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
        completed ? 'bg-green-500 text-cream' : 'border border-sand text-transparent'
      }`}
      aria-hidden="true"
    >
      ✓
    </span>
  );
}

export function TrainingOrientation({ initialProgress }: TrainingOrientationProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [activeChapter, setActiveChapter] = useState<ChapterKey>('welcome');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      ),
    [],
  );

  const active = chapters.find((chapter) => chapter.key === activeChapter) ?? chapters[0];

  async function markComplete() {
    setMessage('');
    setIsSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch('/api/onboarding/orientation-progress', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        chapter: active.key,
        completed: true,
      }),
    });

    const body = (await response.json()) as ApiResponse<Onboarding>;

    if (!response.ok || body.error) {
      setMessage(body.error?.message ?? 'Progress could not be saved.');
      setIsSaving(false);
      return;
    }

    setProgress(body.data.orientation_progress ?? { ...progress, [active.key]: true });
    setMessage('Progress saved.');
    setIsSaving(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-xl border border-sand bg-cream p-3">
        {chapters.map((chapter) => {
          const completed = progress[chapter.key];
          const isActive = activeChapter === chapter.key;

          return (
            <button
              key={chapter.key}
              type="button"
              onClick={() => setActiveChapter(chapter.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                isActive ? 'bg-peach-light' : 'hover:bg-sand/40'
              }`}
            >
              <Checkmark completed={completed} />
              <span className="text-sm font-semibold text-espresso">{chapter.title}</span>
            </button>
          );
        })}
      </aside>

      <section>
        {/* VIDEO_URL placeholder */}
        <div className="flex aspect-video items-center justify-center rounded-xl bg-sand">
          <h3 className="text-xl font-semibold text-warm-gray">{active.title}</h3>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-sm text-warm-gray">
            Rewatch this chapter anytime. Completion is saved for your records.
          </p>

          <Button onClick={markComplete} disabled={isSaving}>
            {progress[active.key] ? 'Mark again' : isSaving ? 'Saving...' : 'Mark as complete'}
          </Button>
        </div>

        {message ? <p className="mt-3 text-sm text-brown-mid">{message}</p> : null}
      </section>
    </div>
  );
}
