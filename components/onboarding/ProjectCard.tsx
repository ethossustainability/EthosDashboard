'use client';

import type { Project } from '@/types/projects';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';

type ProjectWithOptionalShift = Project & {
  upcoming_shift?: {
    start_datetime: string;
    end_datetime: string;
  } | null;
};

type ProjectCardProps = {
  project: ProjectWithOptionalShift;
  onApply: () => void;
};

function getProjectType(projectTypeId: Project['project_type_id']) {
  if (projectTypeId === 1) return { label: 'Event', color: 'green' as const };
  if (projectTypeId === 2) return { label: 'Campaign', color: 'peach' as const };
  if (projectTypeId === 3) return { label: 'Program', color: 'blue' as const };
  return { label: 'HQ', color: 'sand' as const };
}

function formatShiftDate(startDatetime: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(startDatetime));
}

export function ProjectCard({ project, onApply }: ProjectCardProps) {
  const projectType = getProjectType(project.project_type_id);

  return (
    <article className="flex min-h-56 flex-col rounded-xl border border-sand bg-cream p-5 transition hover:shadow-md">
      <div className="mb-4">
        <Tag label={projectType.label} color={projectType.color} />
      </div>

      <h2 className="text-base font-semibold text-espresso">{project.name}</h2>

      <div className="mt-4 space-y-2 text-sm text-warm-gray">
        <p>
          {project.upcoming_shift
            ? formatShiftDate(project.upcoming_shift.start_datetime)
            : 'Schedule coming soon'}
        </p>
        <p>Up to {project.max_applications} volunteers</p>
      </div>

      <Button variant="primary" size="sm" className="mt-auto w-full" onClick={onApply}>
        Apply
      </Button>
    </article>
  );
}
