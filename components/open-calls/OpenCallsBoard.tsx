'use client';

import { useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { ApplicationStatus } from '@/types/applications';
import type { ApiResponse } from '@/types/api';
import type { Project } from '@/types/projects';
import { OpenCallApplicationSheet } from '@/components/open-calls/OpenCallApplicationSheet';
import { OpenCallFilters } from '@/components/open-calls/OpenCallFilters';
import { OpenCallProjectCard } from '@/components/open-calls/OpenCallProjectCard';
import { MyApplicationsPanel } from '@/components/open-calls/MyApplicationsPanel';

export type OpenCallProject = Project & {
  chapter_name: string;
  type_name: string;
  is_hq: boolean;
  upcoming_shift: { start_datetime: string; end_datetime: string } | null;
};

export type OpenCallApplication = {
  application_id: string;
  project_id: string;
  project_name: string;
  status: ApplicationStatus;
  submitted_at: string;
};

export type OpenCallUser = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  guardian_name: string;
  guardian_email: string;
  guardian_phone: string | null;
};

type OpenCallsBoardProps = {
  projects: OpenCallProject[];
  userApplications: OpenCallApplication[];
  activeProjectCount: number;
  pendingApplicationCount: number;
  isOnHqProject: boolean;
  userChapterId: string | null;
  user: OpenCallUser;
};

function matchesChapterFilter(
  project: OpenCallProject,
  chapterFilter: 'own' | 'nearby' | 'hq' | 'all',
  userChapterId: string | null,
) {
  if (chapterFilter === 'all') return true;
  if (chapterFilter === 'hq') return project.is_hq;
  if (chapterFilter === 'own') return project.chapter_id === userChapterId;
  return !project.is_hq && project.chapter_id !== userChapterId;
}

export function OpenCallsBoard({
  projects,
  userApplications,
  activeProjectCount,
  pendingApplicationCount,
  isOnHqProject,
  userChapterId,
  user,
}: OpenCallsBoardProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | '1' | '2' | '3'>('');
  const [chapterFilter, setChapterFilter] = useState<'own' | 'nearby' | 'hq' | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<OpenCallProject | null>(null);
  const [localApplications, setLocalApplications] = useState(userApplications);
  const [localPendingCount, setLocalPendingCount] = useState(pendingApplicationCount);
  const [actionError, setActionError] = useState('');

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      ),
    [],
  );

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch = !term || project.name.toLowerCase().includes(term);
      const matchesType = !typeFilter || String(project.project_type_id) === typeFilter;
      const matchesChapter = matchesChapterFilter(project, chapterFilter, userChapterId);

      return matchesSearch && matchesType && matchesChapter;
    });
  }, [chapterFilter, projects, search, typeFilter, userChapterId]);

  const applicationsByProject = useMemo(() => {
    return new Map(localApplications.map((application) => [application.project_id, application]));
  }, [localApplications]);

  function canApply(project: OpenCallProject) {
    if (activeProjectCount >= 3) return false;
    if (localPendingCount >= 3) return false;
    if (isOnHqProject && !project.is_hq) return false;
    return true;
  }

  function addLocalApplication(project: OpenCallProject, applicationId: string) {
    const application: OpenCallApplication = {
      application_id: applicationId,
      project_id: project.project_id,
      project_name: project.name,
      status: 'Pending',
      submitted_at: new Date().toISOString(),
    };

    setLocalApplications((current) => [application, ...current]);
    setLocalPendingCount((current) => current + 1);
  }

  async function submitNoApp(project: OpenCallProject) {
    setActionError('');

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        project_id: project.project_id,
        why_join: 'No App open call join submitted.',
        experience: null,
        availability_notes: null,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        guardian_name: user.guardian_name,
        guardian_email: user.guardian_email,
        guardian_phone: user.guardian_phone,
      }),
    });

    const body = (await response.json()) as ApiResponse<{ application_id: string }>;

    if (!response.ok || body.error || !body.data) {
      setActionError(body.error?.message ?? 'Could not join this open call.');
      return;
    }

    addLocalApplication(project, body.data.application_id);
  }

  function handleApply(project: OpenCallProject) {
    if (project.open_call_app_level === 'No App') {
      void submitNoApp(project);
      return;
    }

    setSelectedProject(project);
  }

  function handleSubmitted(project: OpenCallProject, applicationId: string) {
    addLocalApplication(project, applicationId);
    setSelectedProject(null);
  }

  function handleWithdraw(applicationId: string) {
    setLocalApplications((current) =>
      current.map((application) =>
        application.application_id === applicationId
          ? { ...application, status: 'Withdrawn' }
          : application,
      ),
    );
    setLocalPendingCount((current) => Math.max(0, current - 1));
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-espresso">Open Calls</h1>
        <p className="mt-2 text-sm text-warm-gray">Projects looking for volunteers</p>
        <p className="mt-3 text-sm font-semibold text-brown-mid">
          You have {activeProjectCount} of 3 active projects.
        </p>
      </header>

      <OpenCallFilters
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        chapterFilter={chapterFilter}
        onChapterFilterChange={setChapterFilter}
      />

      {actionError ? <p className="text-sm text-red-500">{actionError}</p> : null}

      {filteredProjects.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const application = applicationsByProject.get(project.project_id);

            return (
              <OpenCallProjectCard
                key={project.project_id}
                project={project}
                applicationStatus={application?.status ?? null}
                canApply={canApply(project)}
                isOnHqProject={isOnHqProject}
                onApply={() => handleApply(project)}
              />
            );
          })}
        </section>
      ) : (
        <p className="rounded-xl border border-sand bg-cream px-5 py-12 text-center text-sm text-warm-gray">
          No open calls found.
        </p>
      )}

      <MyApplicationsPanel applications={localApplications} onWithdraw={handleWithdraw} />

      {selectedProject ? (
        <OpenCallApplicationSheet
          project={selectedProject}
          maxSteps={selectedProject.open_call_app_level === 'Mid App' ? 2 : 4}
          user={user}
          onClose={() => setSelectedProject(null)}
          onSubmitted={(applicationId) => handleSubmitted(selectedProject, applicationId)}
        />
      ) : null}
    </div>
  );
}
