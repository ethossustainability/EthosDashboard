'use client';

import { Button } from '@/components/ui/Button';

type LeadTaskActionsProps = {
  onNewTask: () => void;
};

export function LeadTaskActions({ onNewTask }: LeadTaskActionsProps) {
  return (
    <Button variant="primary" size="sm" onClick={onNewTask}>
      New Task
    </Button>
  );
}
