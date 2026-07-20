'use client';

import { useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { ApiResponse } from '@/types/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export type PolicyDocument = {
  file_id: string;
  file_name: string;
  drive_url: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
};

type PolicyDocumentListProps = {
  documents: PolicyDocument[];
};

type AcknowledgeResponse = {
  acknowledgment_id: string;
  user_id: string;
  file_id: string;
  acknowledged_at: string;
};

export function PolicyDocumentList({ documents }: PolicyDocumentListProps) {
  const [policyDocuments, setPolicyDocuments] = useState(documents);
  const [message, setMessage] = useState('');
  const allAcknowledged =
    policyDocuments.length > 0 && policyDocuments.every((document) => document.acknowledged);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      ),
    [],
  );

  async function markReviewed(fileId: string) {
    setMessage('');

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch('/api/policy-acknowledgments/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ file_id: fileId }),
    });

    const body = (await response.json()) as ApiResponse<AcknowledgeResponse>;

    if (!response.ok || body.error) {
      setMessage(body.error?.message ?? 'Could not mark this document as reviewed.');
      return;
    }

    setPolicyDocuments((current) =>
      current.map((document) =>
        document.file_id === fileId
          ? {
              ...document,
              acknowledged: true,
              acknowledged_at: body.data.acknowledged_at,
            }
          : document,
      ),
    );
  }

  return (
    <div className="rounded-xl border border-sand bg-cream">
      {allAcknowledged ? (
        <div className="border-b border-sand px-5 py-4 text-sm font-semibold text-green-700">
          All documents reviewed ✓
        </div>
      ) : null}

      {policyDocuments.length > 0 ? (
        policyDocuments.map((document) => (
          <div
            key={document.file_id}
            className="flex items-center gap-4 border-b border-sand px-5 py-4 last:border-b-0"
          >
            <a
              href={document.drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate font-semibold text-espresso underline-offset-4 hover:underline"
            >
              {document.file_name}
            </a>

            {document.acknowledged ? (
              <Badge label="Reviewed ✓" variant="success" />
            ) : (
              <>
                <Badge label="Review required" variant="peach" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void markReviewed(document.file_id);
                  }}
                >
                  Mark as reviewed
                </Button>
              </>
            )}
          </div>
        ))
      ) : (
        <p className="px-5 py-8 text-center text-sm text-warm-gray">
          No policy documents yet
        </p>
      )}

      {message ? <p className="border-t border-sand px-5 py-3 text-sm text-red-500">{message}</p> : null}
    </div>
  );
}
