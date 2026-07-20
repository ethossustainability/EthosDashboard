'use client';

import { Button } from '@/components/ui/Button';

type ConfirmDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
};

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 px-4">
      <section className="z-[51] w-full max-w-sm rounded-2xl bg-cream p-6 shadow-xl">
        <h2 className="text-lg font-bold text-espresso">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-warm-gray">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>

          {confirmVariant === 'danger' ? (
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-cream"
            >
              {confirmLabel}
            </button>
          ) : (
            <Button variant="primary" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
