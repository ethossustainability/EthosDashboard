import type * as React from 'react';
import { EthosLogo } from '@/components/layout/EthosLogo';

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-[2fr_3fr] bg-cream text-espresso">
      <section className="flex min-h-screen flex-col items-center justify-center bg-espresso px-10 text-center">
        <EthosLogo variant="dark" size="md" />
        <p className="mt-5 max-w-xs text-sm leading-6 text-cream/80">
          Connecting volunteers to meaningful local projects
        </p>
      </section>

      <main className="flex min-h-screen items-center justify-center bg-cream px-8">
        {children}
      </main>
    </div>
  );
}
