interface Step {
  num: number;
  title: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
}

export default function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div style={{ display: 'flex', gap: '0', marginBottom: '0' }}>
      {steps.map((step, idx) => {
        const isActive = step.num === currentStep;
        const isComplete = step.num < currentStep;

        return (
          <div key={step.num} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {/* Step circle + line */}
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0' }}>
              {/* Circle */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isActive ? '#03FB83' : isComplete ? '#03FB83' : '#1F2937',
                  border: `2px solid ${isActive ? '#03FB83' : isComplete ? '#03FB83' : '#374151'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: isActive || isComplete ? '#000' : '#9CA3AF',
                  flexShrink: 0,
                }}
              >
                {isComplete ? '✓' : step.num}
              </div>

              {/* Progress line (between circles) */}
              {idx < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    background: isComplete ? '#03FB83' : '#374151',
                    margin: '0 8px',
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
