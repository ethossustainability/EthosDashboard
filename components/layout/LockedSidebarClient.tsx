'use client';

import type * as React from 'react';
import { useRouter } from 'next/navigation';
import { LockedSidebarLayout } from './LockedSidebarLayout';

type LockedSidebarClientProps = {
  children: React.ReactNode;
  firstName: string;
  lastName: string;
};

export function LockedSidebarClient({
  children,
  firstName,
  lastName,
}: LockedSidebarClientProps) {
  const router = useRouter();

  return (
    <LockedSidebarLayout
      user={{ firstName, lastName }}
      onAvatarClick={() => {
        router.push('/account');
      }}
    >
      {children}
    </LockedSidebarLayout>
  );
}
