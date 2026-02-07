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
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Validating Your Photo
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Checking against EU biometric passport requirements...
        </p>
      </div>

      <PhotoWithSidebar
        file={file}
        overlay={
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        }
        sidebar={
          <div className="flex flex-col h-full">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Validation Checks
            </h4>
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
