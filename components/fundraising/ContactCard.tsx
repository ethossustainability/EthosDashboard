'use client';

import { useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { FundraisingContact } from '@/types/fundraising';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type ContactCardProps = {
  contact: FundraisingContact;
  isBoard: boolean;
  onEdit: (contact: FundraisingContact) => void;
  onDelete: (contactId: string) => void;
};

export function ContactCard({ contact, isBoard, onEdit, onDelete }: ContactCardProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      ),
    [],
  );

  async function confirmDelete() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(`/api/fundraising-contacts/${contact.contact_id}`, {
      method: 'DELETE',
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    });

    const body = (await response.json()) as { error: { message: string } | null };

    if (!response.ok || body.error) {
      setError(body.error?.message ?? 'Unable to delete contact.');
      setConfirmOpen(false);
      return;
    }

    onDelete(contact.contact_id);
  }

  return (
    <article className="rounded-xl border border-sand bg-cream p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-espresso">{contact.name}</h3>
            <Badge label={contact.type} variant="neutral" />
          </div>
          {contact.email ? <p className="mt-2 text-sm text-warm-gray">{contact.email}</p> : null}
          {contact.phone ? <p className="mt-1 text-sm text-warm-gray">{contact.phone}</p> : null}
        </div>

        {isBoard ? (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(contact)}>Edit</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>Delete</Button>
          </div>
        ) : null}
      </div>

      {contact.notes ? (
        <div className="mt-4">
          {notesOpen ? <p className="text-sm leading-6 text-brown-mid">{contact.notes}</p> : null}
          <button
            type="button"
            className="text-sm font-semibold text-espresso underline"
            onClick={() => setNotesOpen((current) => !current)}
          >
            {notesOpen ? 'Hide notes' : 'Show notes'}
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete contact?"
        message={`This removes ${contact.name} from fundraising contacts.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </article>
  );
}
