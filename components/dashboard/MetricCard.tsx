import Link from 'next/link';

type MetricCardProps = {
  label: string;
  value: number | string;
  href?: string;
};

export function MetricCard({ label, value, href }: MetricCardProps) {
  const card = (
    <article className="rounded-xl border border-sand bg-cream p-5 transition hover:shadow-sm">
      <p className="text-3xl font-bold text-espresso">{value}</p>
      <p className="mt-2 text-sm text-warm-gray">{label}</p>
    </article>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }

  return card;
}
