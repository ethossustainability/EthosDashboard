type MetricCardProps = {
  label: string;
  value: number | string;
};

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-sand bg-cream p-5">
      <p className="text-3xl font-bold text-espresso">{value}</p>
      <p className="mt-2 text-sm text-warm-gray">{label}</p>
    </article>
  );
}
