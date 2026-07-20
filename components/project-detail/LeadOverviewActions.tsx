'use client';

import { useRouter } from 'next/navigation';
import type { Project } from '@/types/projects';
import type { Shift } from '@/types/shifts';
import { Button } from '@/components/ui/Button';

type TeamMember = {
  user_id: string;
  first_name: string;
  last_name: string;
  project_role_name: string | null;
  is_lead: boolean;
};

type LeadOverviewActionsProps = {
  projectId: string;
  pendingCount: number;
  project: Project;
  shifts: Shift[];
  teamMembers: TeamMember[];
  onFlagVolunteer: (volunteer: TeamMember) => void;
};

export function LeadOverviewActions({ projectId, pendingCount }: LeadOverviewActionsProps) {
  const router = useRouter();

  return (
    <div className="mb-4 rounded-xl border border-sand bg-peach-light p-4">
      {pendingCount > 0 ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}/applications`)}
        >
          Review Applications ({pendingCount} pending)
        </Button>
      ) : (
        <p className="text-sm text-warm-gray">No pending applications</p>
      )}
    </div>
  );
}
