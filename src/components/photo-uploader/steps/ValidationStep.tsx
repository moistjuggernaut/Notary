import { useState, useEffect } from "react";
import { Loader2, CheckCircle, Circle } from "lucide-react";
import { ChecklistItem } from "@/components/ui/checklist-item";
import PhotoWithSidebar from "../photo-with-sidebar";

type CheckStatus = "pending" | "checking" | "done";

type ValidationCheck = {
  label: string;
  status: CheckStatus;
};

const VALIDATION_CHECKS: string[] = [
  "Detecting face",
  "Checking face position",
  "Analyzing expression",
  "Verifying background",
  "Assessing image quality",
  "Confirming ICAO compliance",
];

const TICK_INTERVAL_MS = 600;

interface ValidationStepProps {
  file: File;
}

export default function ValidationStep({ file }: ValidationStepProps) {
  const [checks, setChecks] = useState<ValidationCheck[]>(() =>
    VALIDATION_CHECKS.map((label, i) => ({
      label,
      status: i === 0 ? "checking" : "pending",
    })),
  );

  useEffect(() => {
    let current = 0;

    const timer = setInterval(() => {
      current += 1;

      setChecks(
        VALIDATION_CHECKS.map((label, i) => {
          if (i < current) return { label, status: "done" as const };
          if (i === current) return { label, status: "checking" as const };
          return { label, status: "pending" as const };
        }),
      );

      // Stop advancing once every item is done; keep the last item
      // in "done" so the list stays fully green while the API finishes.
      if (current >= VALIDATION_CHECKS.length) {
        clearInterval(timer);
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

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
              {checks.map((check) => (
                <li key={check.label}>
                  {check.status === "done" && (
                    <ChecklistItem
                      icon={CheckCircle}
                      variant="emerald"
                      size="sm"
                    >
                      {check.label}
                    </ChecklistItem>
                  )}
                  {check.status === "checking" && (
                    <ChecklistItem
                      icon={Loader2}
                      iconClassName="animate-spin"
                      variant="blue"
                      size="sm"
                    >
                      <span className="animate-pulse">{check.label}</span>
                    </ChecklistItem>
                  )}
                  {check.status === "pending" && (
                    <ChecklistItem
                      icon={Circle}
                      variant="gray"
                      size="sm"
                    >
                      {check.label}
                    </ChecklistItem>
                  )}
                </li>
              ))}
            </ul>
          </div>
        }
      />
    </div>
  );
}
