'use client';

import { Chip } from '@/components/ui/Chip';
import { Select } from '@/components/ui/Select';

type FileCategoryFilter = 'all' | 'Project' | 'Universal';

type FileFiltersProps = {
  activeCategory: FileCategoryFilter;
  onCategoryChange: (category: FileCategoryFilter) => void;
  activeProject: string | null;
  onProjectChange: (projectId: string | null) => void;
  projects: Array<{ project_id: string; name: string }>;
};

const categoryFilters: Array<{ label: string; value: FileCategoryFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Project Files', value: 'Project' },
  { label: 'Universal', value: 'Universal' },
];

export function FileFilters({
  activeCategory,
  onCategoryChange,
  activeProject,
  onProjectChange,
  projects,
}: FileFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categoryFilters.map((filter) => (
          <Chip
            key={filter.value}
            label={filter.label}
            active={activeCategory === filter.value}
            onClick={() => onCategoryChange(filter.value)}
          />
        ))}
      </div>

      {activeCategory === 'Project' ? (
        <Select
          label="Project"
          value={activeProject ?? ''}
          onChange={(value) => onProjectChange(value || null)}
          options={[
            { value: '', label: 'All projects' },
            ...projects.map((project) => ({
              value: project.project_id,
              label: project.name,
            })),
          ]}
          className="max-w-sm"
        />
      ) : null}
    </div>
  );
}
