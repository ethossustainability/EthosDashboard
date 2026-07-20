'use client';

import { useMemo, useState } from 'react';
import type { Donation, FundraisingContact } from '@/types/fundraising';
import { ContactFormSheet } from '@/components/fundraising/ContactFormSheet';
import { ContactList } from '@/components/fundraising/ContactList';
import { DonationFormSheet } from '@/components/fundraising/DonationFormSheet';
import { DonationList } from '@/components/fundraising/DonationList';
import { FundraisingGoalCard } from '@/components/fundraising/FundraisingGoalCard';

export type DonationListItem = Donation & {
  donor_name: string | null;
};

type FundraisingDashboardProps = {
  donations: DonationListItem[];
  contacts: FundraisingContact[];
  totalRaised: number;
  goal: number | null;
  isBoard: boolean;
  year: number;
};

export function FundraisingDashboard({
  donations,
  contacts,
  totalRaised,
  goal,
  isBoard,
  year,
}: FundraisingDashboardProps) {
  const [localDonations, setLocalDonations] = useState(donations);
  const [localContacts, setLocalContacts] = useState(contacts);
  const [donationSheetOpen, setDonationSheetOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<DonationListItem | null>(null);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<FundraisingContact | null>(null);

  const currentTotalRaised = useMemo(
    () => localDonations.reduce((total, donation) => total + donation.amount, 0),
    [localDonations],
  );

  function hydrateDonation(donation: Donation): DonationListItem {
    const contact = localContacts.find((item) => item.contact_id === donation.contact_id);
    return { ...donation, donor_name: contact?.name ?? null };
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-espresso">Fundraising</h1>
        <p className="mt-2 text-sm text-warm-gray">Ethos Sustainability · {year}</p>
      </header>

      <div className="space-y-8">
        <FundraisingGoalCard
          totalRaised={currentTotalRaised || totalRaised}
          goal={goal}
          donations={localDonations}
          contacts={localContacts}
        />

        <DonationList
          donations={localDonations}
          isBoard={isBoard}
          onAdd={() => {
            setEditingDonation(null);
            setDonationSheetOpen(true);
          }}
          onEdit={(donation) => {
            setEditingDonation(donation);
            setDonationSheetOpen(true);
          }}
          onDeleted={(donationId) =>
            setLocalDonations((current) => current.filter((donation) => donation.donation_id !== donationId))
          }
        />

        <ContactList
          contacts={localContacts}
          isBoard={isBoard}
          onAdd={() => {
            setEditingContact(null);
            setContactSheetOpen(true);
          }}
          onEdit={(contact) => {
            setEditingContact(contact);
            setContactSheetOpen(true);
          }}
          onDeleted={(contactId) =>
            setLocalContacts((current) => current.filter((contact) => contact.contact_id !== contactId))
          }
        />
      </div>

      {donationSheetOpen ? (
        <DonationFormSheet
          donation={editingDonation}
          contacts={localContacts}
          onClose={() => setDonationSheetOpen(false)}
          onSaved={(donation) => {
            const hydrated = hydrateDonation(donation);
            setLocalDonations((current) =>
              editingDonation
                ? current.map((item) => (item.donation_id === donation.donation_id ? hydrated : item))
                : [hydrated, ...current],
            );
            setDonationSheetOpen(false);
          }}
        />
      ) : null}

      {contactSheetOpen ? (
        <ContactFormSheet
          contact={editingContact}
          onClose={() => setContactSheetOpen(false)}
          onSaved={(contact) => {
            setLocalContacts((current) =>
              editingContact
                ? current.map((item) => (item.contact_id === contact.contact_id ? contact : item))
                : [...current, contact].sort((a, b) => a.name.localeCompare(b.name)),
            );
            setContactSheetOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
