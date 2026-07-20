'use client';

import { Select } from '@/components/ui/Select';

type ViewMode = 'list' | 'kanban';
type GroupBy = 'status' | 'due_date' | 'ungrouped';
type OrderBy = 'due_date' | 'updated' | 'alpha';

type ProjectTaskControlsProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  orderBy: OrderBy;
  onOrderByChange: (orderBy: OrderBy) => void;
};

const groupOptions = [
  { value: 'status', label: 'Status' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'ungrouped', label: 'Ungrouped' },
];

const orderOptions = [
  { value: 'due_date', label: 'Due Date' },
  { value: 'updated', label: 'Recently Updated' },
  { value: 'alpha', label: 'Alphabetical' },
];

export function ProjectTaskControls({
  viewMode,
  onViewModeChange,
  groupBy,
  onGroupByChange,
  orderBy,
  onOrderByChange,
}: ProjectTaskControlsProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="inline-flex rounded-md bg-sand p-1">
        {(['list', 'kanban'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={`h-9 rounded px-4 text-sm font-semibold capitalize transition ${
              viewMode === mode
                ? 'bg-espresso text-cream'
                : 'bg-sand text-espresso hover:bg-peach-light'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Group by"
          value={groupBy}
          onChange={(value) => onGroupByChange(value as GroupBy)}
          options={groupOptions}
          className="min-w-44"
        />
        <Select
          label="Order by"
          value={orderBy}
          onChange={(value) => onOrderByChange(value as OrderBy)}
          options={orderOptions}
          className="min-w-44"
        />
      </div>
    </div>
  );
}
