import type { Metadata } from 'next';
import type * as React from 'react';
import { DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ethos',
  description: 'Volunteer management for Ethos Sustainability.',
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={dmSans.className}>
      <body className="bg-cream text-espresso">{children}</body>
    </html>
  );
}
