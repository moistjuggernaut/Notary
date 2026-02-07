import { Loader2, Circle } from "lucide-react";
import { ChecklistItem } from "@/components/ui/checklist-item";
import PhotoWithSidebar from "../photo-with-sidebar";

const VALIDATION_CHECKS: string[] = [
  "Detecting face",
  "Checking face position",
  "Analyzing expression",
  "Verifying background",
  "Assessing image quality",
  "Confirming ICAO compliance",
];

interface ValidationStepProps {
  file: File;
}

export default function ValidationStep({ file }: ValidationStepProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12 min-h-[480px] sm:min-h-[520px] lg:min-h-[560px]">
      <PhotoWithSidebar
        file={file}
        overlay={
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        }
        sidebar={
          <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Validation Checks
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
