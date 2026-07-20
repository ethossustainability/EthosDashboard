'use client';

import { useState } from 'react';
import type { Task } from '@/types/tasks';
import { ProjectTaskControls } from '@/components/project-detail/ProjectTaskControls';
import { ProjectTaskKanbanView } from '@/components/project-detail/ProjectTaskKanbanView';
import { ProjectTaskListView } from '@/components/project-detail/ProjectTaskListView';
import { TaskDetailSheet } from '@/components/project-detail/TaskDetailSheet';

type ViewMode = 'list' | 'kanban';
type GroupBy = 'status' | 'due_date' | 'ungrouped';
type OrderBy = 'due_date' | 'updated' | 'alpha';

type ProjectTask = Task & {
  project_name: string;
  assignee_name: string;
  created_by_name?: string;
};

type ProjectTasksTabProps = {
  tasks: ProjectTask[];
  currentUserId: string;
  isLead: boolean;
  isBoard: boolean;
};

export function ProjectTasksTab({
  tasks,
  currentUserId,
  isLead,
  isBoard,
}: ProjectTasksTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [orderBy, setOrderBy] = useState<OrderBy>('due_date');
  const [localTasks, setLocalTasks] = useState(tasks);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const remainingCount = localTasks.filter((task) => task.status !== 'Complete').length;

  function handleStatusUpdated(updatedTask: ProjectTask) {
    setLocalTasks((current) =>
      current.map((task) => (task.task_id === updatedTask.task_id ? updatedTask : task)),
    );
    setSelectedTask(updatedTask);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-espresso">Tasks</h2>
          <p className="mt-1 text-sm text-warm-gray">{remainingCount} tasks remaining</p>
        </div>
      </div>

      <div className="mb-8">
        <ProjectTaskControls
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          orderBy={orderBy}
          onOrderByChange={setOrderBy}
        />
      </div>

      {viewMode === 'list' ? (
        <ProjectTaskListView
          tasks={localTasks}
          groupBy={groupBy}
          orderBy={orderBy}
          onTaskClick={(task) => setSelectedTask({ ...task, project_name: task.project_name ?? '' })}
          currentUserId={currentUserId}
        />
      ) : (
        <ProjectTaskKanbanView
          tasks={localTasks}
          onTaskClick={(task) => setSelectedTask({ ...task, project_name: task.project_name ?? '' })}
        />
      )}

      {selectedTask ? (
        <TaskDetailSheet
          task={selectedTask}
          currentUserId={currentUserId}
          isLead={isLead}
          isBoard={isBoard}
          onClose={() => setSelectedTask(null)}
          onStatusUpdated={(task) => handleStatusUpdated({ ...task, project_name: task.project_name ?? '' })}
        />
      ) : null}
    </div>
  );
}
