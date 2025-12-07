import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilePreview from "../FilePreview";
import ErrorDisplay from "../ErrorDisplay";
import { StepActions } from "@/components/ui/step-actions";

interface PreviewStepProps {
  file: File;
  onRemoveFile: () => void;
  onValidate: () => void;
  isValidating: boolean;
  isValidationAllowed: boolean;
  quickCheckError: string | null;
}

export default function PreviewStep({
  file,
  onRemoveFile,
  onValidate,
  isValidating,
  isValidationAllowed,
  quickCheckError,
}: PreviewStepProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Preview & Quick Check</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Your photo has been uploaded. Review it and proceed with validation.
        </p>
      </div>

      <div className="space-y-6">
        <FilePreview file={file} onRemove={onRemoveFile} />

        {quickCheckError && <ErrorDisplay error={quickCheckError} />}

        <StepActions>
          <Button
            onClick={onValidate}
            disabled={!isValidationAllowed || isValidating}
            size="lg"
            className="flex-1"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white" />
                Validating...
              </>
            ) : (
              <>
                <Upload />
                Run EU Validation
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onRemoveFile}
            size="lg"
            className="sm:w-auto"
            disabled={isValidating}
          >
            Use Different Photo
          </Button>
        </StepActions>
      </div>
    </div>
  );
}
