import { XCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepActions } from "@/components/ui/step-actions";
import type { ValidationResult } from "@/types/validation";

interface ErrorStepProps {
  result: ValidationResult;
  onTryAgain: () => void;
}

export default function ErrorStep({ result, onTryAgain }: ErrorStepProps) {
  const primaryCheck = result.checks && result.checks.length > 0 ? result.checks[0] : null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12">
      {/* Combined Error Card */}
      <div className="mb-8 p-4 sm:p-6 rounded-lg bg-red-50 border-l-4 border-red-500">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            {primaryCheck && (
              <>
                <h3 className="text-lg sm:text-xl font-semibold text-red-900 mb-1">
                  {primaryCheck.name}
                </h3>
                <p className="text-sm text-red-700">
                  {primaryCheck.description}
                </p>
              </>
            )}

            {/* Additional Checks if any */}
            {result.checks && result.checks.length > 1 && (
              <div className="mt-4 space-y-2 pt-4 border-t border-red-200">
                {result.checks.slice(1).map((check, index) => (
                  <div key={index}>
                    <p className="text-sm font-medium text-red-900">{check.name}</p>
                    <p className="text-xs text-red-700 mt-0.5">{check.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="mb-8 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {result.recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start">
                <span className="mr-2">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button */}
      <StepActions>
        <Button
          onClick={onTryAgain}
          size="lg"
          className="w-full"
        >
          <Upload className="w-4 h-4" />
          Try Different Photo
        </Button>
      </StepActions>
    </div>
  );
}

