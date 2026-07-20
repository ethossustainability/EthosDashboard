'use client';

type ProgressStepsProps = {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
};

export function ProgressSteps({
  steps,
  currentStep,
  onStepClick,
}: ProgressStepsProps) {
  const clampedStep = Math.min(Math.max(currentStep, 1), steps.length);
  const progressPercent =
    steps.length > 1 ? ((clampedStep - 1) / (steps.length - 1)) * 100 : 100;

  return (
    <div>
      <div className="relative h-2 rounded-full bg-sand">
        <div
          className="h-2 rounded-full bg-peach transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < clampedStep;
          const isCurrent = stepNumber === clampedStep;
          const canClick = Boolean(onStepClick && stepNumber <= clampedStep);

          return (
            <button
              key={step}
              type="button"
              disabled={!canClick}
              onClick={() => onStepClick?.(stepNumber)}
              className="flex min-w-0 flex-col items-center gap-2 disabled:cursor-default"
            >
              <span
                className={`h-3 w-3 rounded-full ${
                  isCompleted || isCurrent ? 'bg-peach' : 'bg-sand'
                }`}
              />
              <span
                className={`truncate text-xs ${
                  isCurrent
                    ? 'font-bold text-espresso'
                    : isCompleted
                      ? 'text-espresso'
                      : 'text-warm-gray'
                }`}
              >
                {step}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
