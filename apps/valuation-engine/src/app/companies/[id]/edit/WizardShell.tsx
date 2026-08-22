'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { C, FONT_SANS, FONT_MONO } from '@/lib/theme';
import ProfileStep from './profile/ProfileStep';
import QuestionnaireStep from './questionnaire/QuestionnaireStep';
import FinancialsStep from './financials/FinancialsStep';
import CapTableStep from './captable/CapTableStep';
import ComparablesStep from './comparables/ComparablesStep';
import ParametersStep from './parameters/ParametersStep';

type WizardStep = 'profile' | 'questionnaire' | 'financials' | 'captable' | 'comparables' | 'parameters';

interface WizardShellProps {
  company: any;
}

interface WizardData {
  profile: any;
  questionnaire: any;
  financials: any[];
  captable: any;
  comparables: any;
  parameters: any;
}

export default function WizardShell({ company }: WizardShellProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('profile');
  const [isLoading, setIsLoading] = useState(false);

  const [wizardData, setWizardData] = useState<WizardData>({
    profile: company || {},
    questionnaire: { answers: {} },
    financials: Array.from({ length: 7 }, (_, i) => ({ yearOffset: i - 1, revenue: 0 })),
    captable: { shareholders: [] },
    comparables: { companies: [] },
    parameters: { method_weights: {} },
  });

  const steps: { key: WizardStep; label: string; index: number }[] = [
    { key: 'profile', label: 'Company Profile', index: 0 },
    { key: 'questionnaire', label: 'Questionnaire', index: 1 },
    { key: 'financials', label: 'Financials', index: 2 },
    { key: 'captable', label: 'Cap Table', index: 3 },
    { key: 'comparables', label: 'Comparables', index: 4 },
    { key: 'parameters', label: 'Valuation Parameters', index: 5 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const updateWizardData = (step: keyof WizardData, data: any) => {
    setWizardData((prev) => ({ ...prev, [step]: data }));
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
      window.scrollTo(0, 0);
    }
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/companies/${company.id}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: wizardData.profile,
          financials: wizardData.financials,
          questionnaire: wizardData.questionnaire,
          weights: wizardData.parameters.method_weights,
        }),
      });

      const data = await response.json();
      if (data.redirect) {
        router.push(data.redirect);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Generate report error:', err);
      alert('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: C.bg,
    color: C.text,
    fontFamily: FONT_SANS,
    minHeight: '100vh',
    padding: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '2rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  };

  const subtitleStyle: React.CSSProperties = {
    color: C.textMuted,
    fontSize: '0.95rem',
  };

  const stepsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
  };

  const stepButtonStyle = (isActive: boolean, isCompleted: boolean): React.CSSProperties => ({
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: isActive ? 600 : 500,
    transition: 'all 0.2s',
    backgroundColor: isActive ? C.accent : isCompleted ? C.border : C.panel,
    color: isActive ? C.bg : C.text,
    whiteSpace: 'nowrap',
  });

  const contentStyle: React.CSSProperties = {
    backgroundColor: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: '0.75rem',
    padding: '2rem',
    marginBottom: '2rem',
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: C.accent,
    color: C.bg,
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: C.border,
    color: C.text,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'profile':
        return <ProfileStep company={wizardData.profile} onUpdate={(data) => updateWizardData('profile', data)} />;
      case 'questionnaire':
        return <QuestionnaireStep company={wizardData.questionnaire} onUpdate={(data) => updateWizardData('questionnaire', data)} />;
      case 'financials':
        return <FinancialsStep company={wizardData.financials} onUpdate={(data) => updateWizardData('financials', data)} />;
      case 'captable':
        return <CapTableStep company={wizardData.captable} onUpdate={(data) => updateWizardData('captable', data)} />;
      case 'comparables':
        return <ComparablesStep company={wizardData.comparables} onUpdate={(data) => updateWizardData('comparables', data)} />;
      case 'parameters':
        return <ParametersStep company={wizardData.parameters} onUpdate={(data) => updateWizardData('parameters', data)} onGenerateReport={handleGenerateReport} isLoading={isLoading} />;
      default:
        return null;
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>{wizardData.profile.name || 'New Company'}</h1>
        <p style={subtitleStyle}>
          Step {currentStepIndex + 1} of {steps.length}
        </p>
      </div>

      <div style={stepsContainerStyle}>
        {steps.map((step) => (
          <button
            key={step.key}
            onClick={() => setCurrentStep(step.key)}
            style={stepButtonStyle(currentStep === step.key, step.index < currentStepIndex)}
          >
            {step.index + 1}. {step.label}
          </button>
        ))}
      </div>

      <div style={contentStyle}>
        {renderStep()}
      </div>

      <div style={navStyle}>
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          style={{ ...secondaryButtonStyle, opacity: currentStepIndex === 0 ? 0.5 : 1 }}
        >
          ← Back
        </button>
        {currentStep !== 'parameters' ? (
          <button onClick={handleNext} style={primaryButtonStyle}>
            Next →
          </button>
        ) : (
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            style={{ ...primaryButtonStyle, opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? '⏳ Generating...' : '📊 Generate Report'}
          </button>
        )}
      </div>
    </div>
  );
}
