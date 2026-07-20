import { Badge } from '@/components/ui/Badge';

type ChapterMetric = {
  chapter_id: string;
  name: string;
  is_hq: boolean;
  activeProjectCount: number;
  memberCount: number;
  pendingApplicationCount: number;
  allocatedBudget: number;
};

type ChapterMetricsTableProps = {
  chapters: ChapterMetric[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function sortChapters(chapters: ChapterMetric[]) {
  return [...chapters].sort((a, b) => {
    if (a.is_hq && !b.is_hq) return -1;
    if (!a.is_hq && b.is_hq) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function ChapterMetricsTable({ chapters }: ChapterMetricsTableProps) {
  const sortedChapters = sortChapters(chapters);
  const totals = chapters.reduce(
    (current, chapter) => ({
      activeProjectCount: current.activeProjectCount + chapter.activeProjectCount,
      memberCount: current.memberCount + chapter.memberCount,
      pendingApplicationCount: current.pendingApplicationCount + chapter.pendingApplicationCount,
      allocatedBudget: current.allocatedBudget + chapter.allocatedBudget,
    }),
    {
      activeProjectCount: 0,
      memberCount: 0,
      pendingApplicationCount: 0,
      allocatedBudget: 0,
    },
  );

  return (
    <section className="rounded-xl border border-sand bg-cream">
      <div className="border-b border-sand px-5 py-4">
        <h2 className="text-lg font-semibold text-espresso">Chapter Breakdown</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-sand text-xs uppercase tracking-wide text-warm-gray">
              <th className="px-5 py-3 font-semibold">Chapter</th>
              <th className="px-5 py-3 font-semibold">Active Projects</th>
              <th className="px-5 py-3 font-semibold">Members</th>
              <th className="px-5 py-3 font-semibold">Pending Applications</th>
              <th className="px-5 py-3 font-semibold">Allocated Budget</th>
            </tr>
          </thead>
          <tbody>
            {sortedChapters.map((chapter) => (
              <tr
                key={chapter.chapter_id}
                className={`border-b border-sand text-sm text-espresso ${
                  chapter.is_hq ? 'bg-sand/40' : ''
                }`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{chapter.name}</span>
                    {chapter.is_hq ? <Badge label="HQ" variant="peach" /> : null}
                  </div>
                </td>
                <td className="px-5 py-4">{chapter.activeProjectCount}</td>
                <td className="px-5 py-4">{chapter.memberCount}</td>
                <td className="px-5 py-4">{chapter.pendingApplicationCount}</td>
                <td className="px-5 py-4">{formatMoney(chapter.allocatedBudget)}</td>
              </tr>
            ))}
            <tr className="text-sm font-bold text-espresso">
              <td className="px-5 py-4">Total</td>
              <td className="px-5 py-4">{totals.activeProjectCount}</td>
              <td className="px-5 py-4">{totals.memberCount}</td>
              <td className="px-5 py-4">{totals.pendingApplicationCount}</td>
              <td className="px-5 py-4">{formatMoney(totals.allocatedBudget)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
