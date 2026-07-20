'use client';

import { useState } from 'react';
import type { Application } from '@/types/applications';
import type { ProjectRole } from '@/types/project-roles';
import { Chip } from '@/components/ui/Chip';
import { ApplicationCard } from '@/components/lead/applications/ApplicationCard';
import { ApplicationReviewSheet } from '@/components/lead/applications/ApplicationReviewSheet';

type ApplicationStatusFilter = 'All' | 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';

type ApplicationListItem = Application & {
  applicant_name: string;
  project_name?: string;
  project_role_name?: string | null;
};

type ApplicationInboxProps = {
  applications: ApplicationListItem[];
  projectId: string;
  projectRoles: ProjectRole[];
};

const filters: ApplicationStatusFilter[] = ['All', 'Pending', 'Approved', 'Rejected', 'Withdrawn'];

function sortApplications(applications: ApplicationListItem[]) {
  return [...applications].sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return a.submitted_at.localeCompare(b.submitted_at);
  });
}

export function ApplicationInbox({
  applications,
  projectId,
  projectRoles,
}: ApplicationInboxProps) {
  const [filter, setFilter] = useState<ApplicationStatusFilter>('All');
  const [localApplications, setLocalApplications] = useState(applications);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationListItem | null>(null);

  const pendingCount = localApplications.filter((application) => application.status === 'Pending').length;
  const filteredApplications = sortApplications(
    filter === 'All'
      ? localApplications
      : localApplications.filter((application) => application.status === filter),
  );

  function replaceApplication(updated: Application) {
    setLocalApplications((current) =>
      current.map((application) =>
        application.application_id === updated.application_id
          ? { ...application, ...updated }
          : application,
      ),
    );

    setSelectedApplication((current) =>
      current?.application_id === updated.application_id
        ? { ...current, ...updated }
        : current,
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-espresso">
          {pendingCount} pending applications
        </h2>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((item) => (
          <Chip
            key={item}
            label={item}
            active={filter === item}
            onClick={() => setFilter(item)}
          />
        ))}
      </div>

      {filteredApplications.length > 0 ? (
        <section className="space-y-3">
          {filteredApplications.map((application) => (
            <ApplicationCard
              key={application.application_id}
              application={application}
              onClick={() => setSelectedApplication(application)}
            />
          ))}
        </section>
      ) : (
        <p className="rounded-xl border border-sand bg-cream p-8 text-center text-sm text-warm-gray">
          No applications found
        </p>
      )}

      {selectedApplication ? (
        <ApplicationReviewSheet
          application={selectedApplication}
          projectRoles={projectRoles}
          onClose={() => setSelectedApplication(null)}
          onApproved={replaceApplication}
          onRejected={replaceApplication}
        />
      ) : null}
    </div>
  );
}
