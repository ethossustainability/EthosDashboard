'use client';

import type { FundraisingContact } from '@/types/fundraising';
import type { DonationListItem } from '@/components/fundraising/FundraisingDashboard';
import { Button } from '@/components/ui/Button';

type FundraisingGoalCardProps = {
  totalRaised: number;
  goal: number | null;
  donations: DonationListItem[];
  contacts: FundraisingContact[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function csvEscape(value: string | number | null) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function FundraisingGoalCard({
  totalRaised,
  goal,
  donations,
  contacts,
}: FundraisingGoalCardProps) {
  const percent = goal ? Math.min(100, Math.round((totalRaised / goal) * 100)) : 0;

  function exportCsv() {
    const donationRows = [
      ['Donations'],
      ['Donor', 'Amount', 'Date', 'Notes'],
      ...donations.map((donation) => [
        donation.donor_name ?? 'Anonymous',
        donation.amount,
        donation.donated_at,
        donation.notes ?? '',
      ]),
      [],
      ['Contacts'],
      ['Name', 'Type', 'Email', 'Phone', 'Notes'],
      ...contacts.map((contact) => [
        contact.name,
        contact.type,
        contact.email ?? '',
        contact.phone ?? '',
        contact.notes ?? '',
      ]),
    ];

    const csv = donationRows.map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ethos-fundraising-${new Date().getFullYear()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-sand bg-cream p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-espresso">Fundraising Goal</h2>
          <p className="mt-1 text-sm text-warm-gray">
            {goal
              ? `${formatMoney(totalRaised)} raised of ${formatMoney(goal)} goal`
              : `${formatMoney(totalRaised)} raised · No goal set`}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-sand">
        <div className="h-full bg-peach transition-all" style={{ width: `${percent}%` }} />
      </div>

      {goal ? <p className="mt-2 text-sm font-semibold text-espresso">{percent}%</p> : null}
    </section>
  );
}
