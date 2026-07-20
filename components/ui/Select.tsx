'use client';

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
};

export function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
  name,
  id,
  className = '',
}: SelectProps) {
  const selectId = id ?? name;

  return (
    <label className={`block ${className}`}>
      {label ? (
        <span className="mb-2 block text-sm font-semibold text-espresso">{label}</span>
      ) : null}

      <span className="relative block">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-11 w-full appearance-none rounded-md border border-sand bg-cream px-3 pr-10 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-peach disabled:cursor-not-allowed disabled:opacity-50"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </label>
  );
}
