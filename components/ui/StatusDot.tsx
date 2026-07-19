type StatusDotProps = {
  status: 'done' | 'active' | 'locked';
};

const statusClasses = {
  done: 'bg-green-500',
  active: 'bg-peach',
  locked: 'bg-sand',
};

export function StatusDot({ status }: StatusDotProps) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${statusClasses[status]}`}
      aria-hidden="true"
    />
  );
}
