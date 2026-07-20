import type { WizardFormData } from './CreateProjectWizard';

type ProjectSettingsStepProps = {
  formData: WizardFormData;
  onChange: (update: Partial<WizardFormData>) => void;
  readinessChecked: boolean;
  onReadinessChange: (checked: boolean) => void;
};

export function ProjectSettingsStep({
  readinessChecked,
  onReadinessChange,
}: ProjectSettingsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-espresso">Visibility</h2>
        <p className="mt-2 text-sm leading-6 text-warm-gray">
          This project is saved as a draft by default. You can publish it from the review step when it is ready for volunteers.
        </p>
      </div>

      <div className="rounded-lg bg-sand p-4 text-sm leading-6 text-brown-mid">
        Note: Once a project is closed, it cannot be reopened. A new project must be created.
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={readinessChecked}
          onChange={(event) => onReadinessChange(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-sand text-peach focus:ring-peach"
        />
        <span className="text-sm font-semibold text-espresso">
          I have reviewed this project and it is ready for volunteers
        </span>
      </label>
    </div>
  );
}
