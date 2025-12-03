import { XCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepActions } from "@/components/ui/step-actions";
import { InfoCard } from "@/components/ui/info-card";
import type { ValidationResult } from "@/types/validation";

interface ErrorStepProps {
  result: ValidationResult;
  onTryAgain: () => void;
}

export default function ErrorStep({ result, onTryAgain }: ErrorStepProps) {
  const primaryCheck = result.checks && result.checks.length > 0 ? result.checks[0] : null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12">
      {/* Error Card */}
      <InfoCard variant="error" icon={XCircle} className="mb-8">
        {primaryCheck && (
          <>
            <h3 className="text-lg sm:text-xl font-semibold mb-1">
              {primaryCheck.name}
            </h3>
            <p className="text-sm opacity-90">
              {primaryCheck.description}
            </p>
          </>
        )}

        {/* Additional Checks if any */}
        {result.checks && result.checks.length > 1 && (
          <div className="mt-4 space-y-2 pt-4 border-t border-red-200">
            {result.checks.slice(1).map((check, index) => (
              <div key={index}>
                <p className="text-sm font-medium">{check.name}</p>
                <p className="text-xs opacity-90 mt-0.5">{check.description}</p>
              </div>
            ))}
          </div>
        )}
      </InfoCard>

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <InfoCard variant="info" title="Recommendations" className="mb-8 p-5">
          <ul className="space-y-1">
            {result.recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm flex items-start">
                <span className="mr-2">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
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
