'use client';

import { Chip } from '@/components/ui/Chip';

type ProjectFiltersProps = {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

const filters = ['All', 'Events', 'Campaigns', 'Programs'];

export function ProjectFilters({ activeFilter, onFilterChange }: ProjectFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Chip
          key={filter}
          label={filter}
          active={activeFilter === filter}
          onClick={() => onFilterChange(filter)}
        />
      ))}
    </div>
  );
}
