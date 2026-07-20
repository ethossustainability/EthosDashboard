'use client';

import { Badge } from '@/components/ui/Badge';

type DirectoryMember = {
  user_id: string;
  first_name: string;
  last_name: string;
  org_role_id: number;
  chapter_id: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
  org_role_name: string;
  chapter_name: string;
};

type MemberListItemProps = {
  member: DirectoryMember;
  badgeCount: number;
  onClick: () => void;
};

function roleBadgeVariant(roleName: string) {
  if (roleName === 'Board') return 'peach';
  if (roleName === 'Project Lead') return 'info';
  return 'neutral';
}

export function MemberListItem({ member, badgeCount, onClick }: MemberListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-sand px-4 py-4 text-left transition hover:bg-sand/30"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-espresso">
            {member.first_name} {member.last_name}
          </p>
          <Badge label={member.org_role_name} variant={roleBadgeVariant(member.org_role_name)} />
        </div>
        <p className="mt-1 text-sm text-warm-gray">{member.chapter_name}</p>
      </div>

      {badgeCount > 0 ? (
        <p className="text-sm text-warm-gray">{badgeCount} badges</p>
      ) : null}
    </button>
  );
}
