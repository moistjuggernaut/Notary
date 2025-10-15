import { useRef } from "react";
import { validateImageFile } from "@/lib/file-utils";
import type { ValidationResult } from "@/types/validation";
import UploadArea from "./UploadArea";
import FilePreview from "./FilePreview";
import ErrorDisplay from "./ErrorDisplay";
import ActionButtons from "./ActionButtons";
import ValidationResults from "./ValidationResults";
import StepIndicator, { type Step } from "./StepIndicator";

interface PhotoUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  onValidatePhoto: () => void;
  isValidating: boolean;
  isValidationAllowed: boolean;
  quickCheckError: string | null;
  validationResult?: ValidationResult | null;
  currentStep: Step;
}

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
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validation = validateImageFile(files[0]);
      if (!validation.isValid) return;
      onFileSelect(files[0]);
    }
  };

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
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Header - Consistent across all states */}
        <div className="px-4 py-6 sm:px-6 lg:px-8 border-b border-gray-100">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
            EU Photo ID Validator
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed transition-opacity duration-300">
            {validationResult
              ? validationResult.summary
              : 'Select a high-quality photo for passport validation.'
            }
          </p>
        </div>

        {/* Main Content Area - with min-height to prevent jumping */}
        <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-6 min-h-[400px]">
          {/* Upload State */}
          {!selectedFile && !validationResult && (
            <div className="animate-in fade-in duration-300">
              <UploadArea
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
              />
            </div>
          )}

          {/* Review State */}
          {selectedFile && !validationResult && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <FilePreview file={selectedFile} onRemove={onRemoveFile} />

              {quickCheckError && <ErrorDisplay error={quickCheckError} />}

              <ActionButtons
                onValidate={onValidatePhoto}
                onRemoveFile={onRemoveFile}
                isValidating={isValidating}
                isValidationAllowed={isValidationAllowed}
              />
            </div>
          )}

          {/* Results State */}
          {validationResult && (
            <div className="animate-in fade-in duration-500">
              <ValidationResults result={validationResult} />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          aria-label="Select photo file"
        />
      </div>
    </div>
  );
}
