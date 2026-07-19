type TagProps = {
  label: string;
  color: 'green' | 'peach' | 'blue' | 'sand';
};

const colorClasses = {
  green: 'bg-green-100 text-green-700',
  peach: 'bg-peach-light text-espresso',
  blue: 'bg-blue-100 text-blue-700',
  sand: 'bg-sand text-espresso',
};

export function Tag({ label, color }: TagProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colorClasses[color]}`}>
      {label}
    </span>
  );
}
