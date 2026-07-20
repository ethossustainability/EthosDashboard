'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

type TeamMember = {
  user_id: string;
  first_name: string;
  last_name: string;
  project_role_name: string | null;
  is_lead: boolean;
};

type TeamRosterProps = {
  team: TeamMember[];
  isLead?: boolean;
  onFlagVolunteer?: (volunteer: {
    user_id: string;
    first_name: string;
    last_name: string;
  }) => void;
};

function sortTeam(team: TeamMember[]) {
  return [...team].sort((a, b) => {
    if (a.is_lead && !b.is_lead) return -1;
    if (!a.is_lead && b.is_lead) return 1;
    return a.first_name.localeCompare(b.first_name);
  });
}

export function TeamRoster({ team, isLead = false, onFlagVolunteer }: TeamRosterProps) {
  if (team.length === 0) {
    return <p className="text-sm text-warm-gray">No team members yet</p>;
  }

  return (
    <div className="rounded-xl border border-sand bg-cream">
      {sortTeam(team).map((member) => (
        <div
          key={member.user_id}
          className="flex items-center justify-between gap-4 border-b border-sand px-4 py-3 transition hover:bg-sand/30 last:border-b-0"
        >
          <Link href={`/directory/${member.user_id}`} className="min-w-0 flex-1">
            <p className="font-semibold text-espresso">
              {member.first_name} {member.last_name}
            </p>
            <p className="mt-1 text-sm text-warm-gray">
              {member.project_role_name ?? 'Project member'}
            </p>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {member.is_lead ? <Badge label="Project Lead" variant="peach" /> : null}
            {isLead && !member.is_lead && onFlagVolunteer ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onFlagVolunteer({
                    user_id: member.user_id,
                    first_name: member.first_name,
                    last_name: member.last_name,
                  })
                }
              >
                Flag
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
