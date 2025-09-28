import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onValidate: () => void;
  onRemoveFile: () => void;
  isValidating: boolean;
  isValidationAllowed: boolean;
}

export default function ActionButtons({
  onValidate,
  onRemoveFile,
  isValidating,
  isValidationAllowed
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={onValidate}
        disabled={!isValidationAllowed || isValidating}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isValidating ? (
          <>
            <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2" />
            Validating...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Run EU Validation
          </>
        )}
      </Button>

      <Button
        variant="outline"
        onClick={onRemoveFile}
        className="sm:w-auto h-11"
        disabled={isValidating}
      >
        Use Different Photo
      </Button>
    </div>
  );
}
