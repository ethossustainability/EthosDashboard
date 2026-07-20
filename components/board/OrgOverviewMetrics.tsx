import { MetricCard } from '@/components/dashboard/MetricCard';

type OrgOverviewMetricsProps = {
  totalProjects: number;
  totalMembers: number;
  eventsThisMonth: number;
  totalFundsRaised: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function OrgOverviewMetrics({
  totalProjects,
  totalMembers,
  eventsThisMonth,
  totalFundsRaised,
}: OrgOverviewMetricsProps) {
  return (
    <section className="grid gap-5 md:grid-cols-2">
      <MetricCard label="Active projects" value={totalProjects} />
      <MetricCard label="Total members" value={totalMembers} />
      <MetricCard label="Events this month" value={eventsThisMonth} />
      <MetricCard label="Funds allocated" value={formatMoney(totalFundsRaised)} />
    </section>
  );
}
