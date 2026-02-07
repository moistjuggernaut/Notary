import { Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChecklistItem } from "@/components/ui/checklist-item";
import PhotoWithSidebar from "../photo-with-sidebar";

interface PreviewStepProps {
  file: File;
  onRemoveFile: () => void;
  onValidate: () => void;
  isValidating: boolean;
}

const ICAO_REMINDERS = [
  "Plain white or light background",
  "Face centered, looking straight at camera",
  "Both eyes open and clearly visible",
  "Neutral expression, mouth closed",
  "No glasses glare or head coverings",
  "High resolution and sharp focus",
];

export default function PreviewStep({
  file,
  onRemoveFile,
  onValidate,
  isValidating,
}: PreviewStepProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12 min-h-[480px] sm:min-h-[520px] lg:min-h-[560px]">
      <PhotoWithSidebar
        file={file}
        sidebar={
          <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Review Your Photo
            </h3>
            <ul className="space-y-2.5">
              {ICAO_REMINDERS.map((item) => (
                <li key={item}>
                  <ChecklistItem icon={CheckCircle} variant="default" size="sm">
                    {item}
                  </ChecklistItem>
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          onClick={onValidate}
          disabled={isValidating}
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
              <Upload className="w-4 h-4" />
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
      </div>
    </div>
  );
}
