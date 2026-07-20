type BadgeProps = {
  label: string;
  variant: 'neutral' | 'success' | 'warning' | 'info' | 'peach';
};

const variantClasses = {
  neutral: 'bg-sand text-warm-gray',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
  peach: 'bg-peach-light text-espresso',
};

export function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}
