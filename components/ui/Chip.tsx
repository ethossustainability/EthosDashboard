'use client';

type ChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-espresso focus:ring-offset-2 focus:ring-offset-cream ${
        active
          ? 'bg-peach text-espresso'
          : 'bg-sand text-warm-gray hover:bg-peach-light hover:text-espresso'
      }`}
    >
      {label}
    </button>
  );
}
