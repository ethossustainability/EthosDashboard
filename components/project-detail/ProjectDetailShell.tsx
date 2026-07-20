'use client';

import { useEffect, useMemo, useState } from 'react';
import type { File } from '@/types/files';
import type { Project } from '@/types/projects';
import type { ProjectUpdate } from '@/types/project-updates';
import type { Shift } from '@/types/shifts';
import type { Task } from '@/types/tasks';
import { ProjectHeader } from '@/components/project-detail/ProjectHeader';
import { OverviewTab } from '@/components/project-detail/OverviewTab';
import { ProjectFilesTab } from '@/components/project-detail/ProjectFilesTab';
import { ProjectTasksTab } from '@/components/project-detail/ProjectTasksTab';
import { ProjectUpdatesTab } from '@/components/project-detail/ProjectUpdatesTab';

export type ProjectDetailTab = 'overview' | 'tasks' | 'files' | 'updates';

type ProjectRoleInfo = {
  project_role_id: string;
  role_name: string;
  description: string | null;
  capacity: number;
};

type TeamMember = {
  user_id: string;
  first_name: string;
  last_name: string;
  project_role_name: string | null;
  is_lead: boolean;
};

type ProjectFile = Pick<
  File,
  'file_id' | 'file_name' | 'file_type' | 'drive_url' | 'description' | 'created_at'
>;

type ProjectFileListItem = File & {
  project_name: string | null;
  added_by_name: string;
};

type ProjectTask = Task & {
  project_name: string;
  assignee_name: string;
  created_by_name?: string;
};

type ProjectDetail = Project & {
  type_name: string;
  chapter_name: string;
  is_hq?: boolean;
  spots_remaining: number | null;
  shifts: Shift[];
  project_roles: ProjectRoleInfo[];
  team: TeamMember[];
  files: ProjectFile[];
};

type ProjectDetailShellProps = {
  project: ProjectDetail;
  tasks: ProjectTask[];
  files: ProjectFileListItem[];
  updates: ProjectUpdate[];
  isLead: boolean;
  isBoard: boolean;
  isMember: boolean;
  currentUserId: string;
  tabCounts?: {
    tasks: number;
  };
};

function isProjectDetailTab(value: string | null): value is ProjectDetailTab {
  return value === 'overview' || value === 'tasks' || value === 'files' || value === 'updates';
}

export function ProjectDetailShell({
  project,
  tasks,
  files,
  updates,
  isLead,
  isBoard,
  isMember,
  currentUserId,
  tabCounts,
}: ProjectDetailShellProps) {
  const storageKey = `project-tab-${project.project_id}`;
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>('overview');

  useEffect(() => {
    const savedTab = window.sessionStorage.getItem(storageKey);
    if (isProjectDetailTab(savedTab)) {
      setActiveTab(savedTab);
    }
  }, [storageKey]);

  useEffect(() => {
    window.sessionStorage.setItem(storageKey, activeTab);
  }, [activeTab, storageKey]);

  const counts = useMemo(
    () => ({
      tasks: tabCounts?.tasks ?? 0,
    }),
    [tabCounts],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <ProjectHeader
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        taskCount={counts.tasks}
        isLead={isLead}
      />

      <div className="mt-8">
        {activeTab === 'overview' ? (
          <OverviewTab
            project={project}
            shifts={project.shifts}
            team={project.team}
            isLead={isLead}
            isBoard={isBoard}
          />
        ) : null}

        {activeTab === 'tasks' ? (
          <ProjectTasksTab
            tasks={tasks}
            currentUserId={currentUserId}
            isLead={isLead}
            isBoard={isBoard}
          />
        ) : null}

        {activeTab === 'files' ? (
          <ProjectFilesTab files={files} />
        ) : null}

        {activeTab === 'updates' ? (
          <ProjectUpdatesTab updates={updates} slackChannelId={project.slack_channel_id} />
        ) : null}
      </div>
    </div>
  );
}
