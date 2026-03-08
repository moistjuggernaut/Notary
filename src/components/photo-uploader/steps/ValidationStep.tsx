import { Loader2, Circle } from "lucide-react";
import { ChecklistItem } from "@/components/ui/checklist-item";
import PhotoWithSidebar from "../photo-with-sidebar";
import { STEP_CONTAINER_CLASS } from "./cta-classes";

const VALIDATION_CHECKS: string[] = [
  "Detecting face",
  "Checking face position",
  "Analyzing expression",
  "Verifying background",
  "Assessing image quality",
  "Checking required dimensions",
];

interface ValidationStepProps {
  file: File;
}

export default function ValidationStep({ file }: ValidationStepProps) {
  return (
    <div className={STEP_CONTAINER_CLASS}>
      <PhotoWithSidebar
        file={file}
        overlay={
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        }
        sidebar={
          <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Checking Your Photo
            </h3>
            <ul className="space-y-2.5">
              {VALIDATION_CHECKS.map((label) => (
                <li key={label}>
                  <ChecklistItem icon={Circle} variant="gray" size="sm">
                    {label}
                  </ChecklistItem>
                </li>
              ))}
            </ul>
          </div>
        }
      />
    </div>
  );
}
