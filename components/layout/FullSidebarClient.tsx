'use client';

import type * as React from 'react';
import { useRouter } from 'next/navigation';
import { FullSidebarLayout } from './FullSidebarLayout';

type FullSidebarClientProps = {
  children: React.ReactNode;
  firstName: string;
  lastName: string;
  navItems?: React.ReactNode;
};

export function FullSidebarClient({
  children,
  firstName,
  lastName,
  navItems = null,
}: FullSidebarClientProps) {
  const router = useRouter();

  return (
    <FullSidebarLayout
      user={{ firstName, lastName }}
      navItems={navItems}
      onAvatarClick={() => {
        router.push('/account');
      }}
    >
      {children}
    </FullSidebarLayout>
  );
}
