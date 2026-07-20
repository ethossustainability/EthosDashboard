'use client';

import type * as React from 'react';
import { useRouter } from 'next/navigation';
import { FullSidebarLayout } from './FullSidebarLayout';

type OrgRoleId = 1 | 2 | 3;

type FullSidebarClientProps = {
  children: React.ReactNode;
  firstName: string;
  lastName: string;
  orgRoleId: OrgRoleId;
  unresolvedLogCount: number;
};

export function FullSidebarClient({
  children,
  firstName,
  lastName,
  orgRoleId,
  unresolvedLogCount,
}: FullSidebarClientProps) {
  const router = useRouter();

  return (
    <FullSidebarLayout
      user={{ firstName, lastName }}
      orgRoleId={orgRoleId}
      unresolvedLogCount={unresolvedLogCount}
      onAvatarClick={() => {
        router.push('/account');
      }}
    >
      {children}
    </FullSidebarLayout>
  );
}
