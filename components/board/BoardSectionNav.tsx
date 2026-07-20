'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type BoardSectionNavProps = {
  unresolvedLogCount: number;
};

const sections = [
  { label: 'Overview', href: '/board/overview' },
  { label: 'Role Management', href: '/board/roles' },
  { label: 'Budget Requests', href: '/board/budget' },
  { label: 'Volunteer Flags', href: '/board/flags' },
  { label: 'System Logs', href: '/board/logs', showBadge: true },
];

export function BoardSectionNav({ unresolvedLogCount }: BoardSectionNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Board Panel sections">
      {sections.map((section) => {
        const active = pathname === section.href || pathname.startsWith(`${section.href}/`);

        return (
          <Link
            key={section.href}
            href={section.href}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              active
                ? 'bg-espresso text-cream'
                : 'text-warm-gray hover:bg-sand/40 hover:text-espresso'
            }`}
          >
            {section.label}
            {section.showBadge && unresolvedLogCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                {unresolvedLogCount > 99 ? '99+' : unresolvedLogCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
