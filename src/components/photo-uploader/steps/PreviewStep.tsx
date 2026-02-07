import { Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChecklistItem } from "@/components/ui/checklist-item";
import PhotoWithSidebar from "../photo-with-sidebar";
import {
  STEP_CONTAINER_CLASS,
  CTA_PRIMARY_BUTTON_CLASS,
  CTA_PRIMARY_COLUMN_CLASS,
  CTA_ROW_CLASS,
  CTA_SECONDARY_BUTTON_CLASS,
  CTA_SECONDARY_COLUMN_CLASS,
} from "./cta-classes";

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
    <div className={STEP_CONTAINER_CLASS}>
      <PhotoWithSidebar
        file={file}
        sidebar={
          <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold text-foreground mb-4">
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

      <div className={`${CTA_ROW_CLASS} mt-6`}>
        <div className={CTA_PRIMARY_COLUMN_CLASS}>
          <Button
            onClick={onValidate}
            disabled={isValidating}
            variant="primary"
            size="lg"
            className={CTA_PRIMARY_BUTTON_CLASS}
          >
            {isValidating ? (
              <>
                <Spinner variant="light" size="default" />
                Validating...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Run EU Validation
              </>
            )}
          </Button>
        </div>

        <div className={CTA_SECONDARY_COLUMN_CLASS}>
          <Button
            variant="outline"
            onClick={onRemoveFile}
            size="lg"
            className={CTA_SECONDARY_BUTTON_CLASS}
            disabled={isValidating}
          >
            Use Different Photo
          </Button>
        </div>
      </div>
    </div>
  );
}
