'use client';

type ToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-peach' : 'bg-sand'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-cream shadow transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>

      {label ? <span className="text-sm font-semibold text-espresso">{label}</span> : null}
    </label>
  );
}
