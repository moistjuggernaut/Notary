import { Check } from "lucide-react";

export type Step = 'upload' | 'review' | 'validating' | 'results';

interface StepIndicatorProps {
  currentStep: Step;
}

const steps = [
  { id: 'upload' as Step, label: 'Upload', number: 1 },
  { id: 'review' as Step, label: 'Review', number: 2 },
  { id: 'validating' as Step, label: 'Validating', number: 3 },
  { id: 'results' as Step, label: 'Results', number: 4 },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const getStepStatus = (stepIndex: number): 'completed' | 'active' | 'upcoming' => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center 
                    transition-all duration-300 font-semibold text-sm sm:text-base
                    ${status === 'completed' 
                      ? 'bg-blue-600 text-white' 
                      : status === 'active'
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                {/* Step Label */}
                <span
                  className={`
                    mt-2 text-xs sm:text-sm font-medium transition-colors duration-300
                    ${status === 'active' || status === 'completed'
                      ? 'text-gray-900'
                      : 'text-gray-500'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 sm:mx-4 mb-6">
                  <div
                    className={`
                      h-full transition-all duration-300
                      ${status === 'completed'
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                      }
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

