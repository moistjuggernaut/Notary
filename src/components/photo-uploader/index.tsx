import { useRef } from "react";
import { validateImageFile } from "@/lib/file-utils";
import type { ValidationResult } from "@/types/validation";
import Stepper from "../ui/Stepper";
import UploadStep from "./steps/UploadStep";
import PreviewStep from "./steps/PreviewStep";
import ValidationStep from "./steps/ValidationStep";
import SuccessStep from "./steps/SuccessStep";
import ErrorStep from "./steps/ErrorStep";

interface PhotoUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  onValidatePhoto: () => void;
  isValidating: boolean;
  isValidationAllowed: boolean;
  quickCheckError: string | null;
  validationResult?: ValidationResult | null;
  currentStep: number;
  onReset: () => void;
}

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Preview" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Results" },
];

export default function PhotoUploader({
  selectedFile,
  onFileSelect,
  onRemoveFile,
  onValidatePhoto,
  isValidating,
  isValidationAllowed,
  quickCheckError,
  validationResult,
  currentStep,
  onReset,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const validation = validateImageFile(files[0]);
      if (!validation.isValid) return;
      onFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Stepper */}
        <div className="px-4 sm:px-6 lg:px-8 py-8 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <UploadStep
            onFileSelect={onFileSelect}
            fileInputRef={fileInputRef}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            openFileDialog={openFileDialog}
          />
        )}

        {currentStep === 2 && selectedFile && (
          <PreviewStep
            file={selectedFile}
            onRemoveFile={onRemoveFile}
            onValidate={onValidatePhoto}
            isValidating={isValidating}
            isValidationAllowed={isValidationAllowed}
            quickCheckError={quickCheckError}
          />
        )}

        {currentStep === 3 && <ValidationStep />}

        {currentStep === 4 && validationResult && (
          <>
            {validationResult.status === "success" ? (
              <SuccessStep result={validationResult} onUploadNew={onReset} />
            ) : (
              <ErrorStep result={validationResult} onTryAgain={onReset} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
