import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StepItem {
  id: number;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className,
}) => {
  return (
    <nav aria-label="Progress" className={cn('w-full py-4', className)}>
      <ol className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
        
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <li key={step.id} className="relative flex flex-col items-center bg-white dark:bg-slate-950 px-2 sm:px-4 z-10">
              <button
                type="button"
                disabled={!onStepClick || isPending}
                onClick={() => onStepClick && onStepClick(step.id)}
                className={cn(
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300',
                  isCompleted && 'bg-success-600 text-white shadow-sm ring-4 ring-success-100 dark:ring-success-950',
                  isCurrent && 'bg-primary-600 text-white shadow-md ring-4 ring-primary-100 dark:ring-primary-950 scale-105',
                  isPending && 'bg-slate-100 text-slate-400 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : step.id}
              </button>
              <div className="mt-2 text-center">
                <span
                  className={cn(
                    'block text-xs sm:text-sm font-semibold tracking-tight transition-colors',
                    isCurrent && 'text-primary-600 dark:text-primary-400',
                    isCompleted && 'text-slate-800 dark:text-slate-200',
                    isPending && 'text-slate-400 dark:text-slate-500'
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="hidden sm:block text-[11px] text-slate-400">{step.description}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
