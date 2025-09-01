import { useRef } from "react";
import { validateImageFile } from "@/lib/file-utils";
import type { ValidationResult } from "@/types/validation";
import UploadArea from "./UploadArea";
import FilePreview from "./FilePreview";
import ErrorDisplay from "./ErrorDisplay";
import ActionButtons from "./ActionButtons";
import ValidationResults from "./ValidationResults";

interface PhotoUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  onValidatePhoto: () => void;
  isValidating: boolean;
  isValidationAllowed: boolean;
  quickCheckError: string | null;
  validationResult?: ValidationResult | null;
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
        {/* Header */}
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
            {validationResult ? 'Validation Results' : 'Upload Your Photo'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {validationResult
              ? validationResult.summary
              : 'Select a high-quality photo for passport validation.'
            }
          </p>
        </div>

        {/* Validation Results */}
        {validationResult && <ValidationResults result={validationResult} />}

        {/* Upload Area */}
        {!validationResult && (
          <div className="px-4 sm:px-6 lg:px-8 pb-6">
            {!selectedFile ? (
              <UploadArea
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
              />
            ) : (
              <div className="space-y-4">
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
          </div>
        )}

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
