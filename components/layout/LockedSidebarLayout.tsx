'use client';

import type * as React from 'react';
import { ProfileAvatarButton } from './ProfileAvatarButton';

type LockedSidebarLayoutProps = {
  children: React.ReactNode;
  user: {
    firstName: string;
    lastName: string;
  };
  onAvatarClick: () => void;
};

export function LockedSidebarLayout({
  children,
  user,
  onAvatarClick,
}: LockedSidebarLayoutProps) {
  return (
    <div className="flex min-h-screen bg-cream text-espresso">
      <aside className="flex h-screen w-16 shrink-0 flex-col items-center bg-espresso">
        <div className="flex w-full justify-center px-3 py-5">
          <div
            className="h-5 w-5 rounded-md bg-cream"
            aria-label="Ethos Sustainability"
          />
        </div>

        <div className="mt-auto flex w-full justify-center px-3 py-5">
          <ProfileAvatarButton
            firstName={user.firstName}
            lastName={user.lastName}
            onClick={onAvatarClick}
          />
        </div>
      </aside>

      <main className="h-screen flex-1 overflow-y-auto bg-cream">{children}</main>
    </div>
  );
}
