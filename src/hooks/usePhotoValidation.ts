import { useState } from "react";
import type { ValidationResult } from "@/types/validation";
import { validatePhoto } from "@/api/client";
import { convertApiResponseToValidationResult } from "@/lib/validation-utils";

export function usePhotoValidation() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setValidationResult(null);
    setCurrentStep(2);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setCurrentStep(1);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setCurrentStep(1);
    setIsValidating(false);
  };

  const handleValidatePhoto = async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    setCurrentStep(3);

    try {
      const apiResponse = await validatePhoto(selectedFile);
      const result = convertApiResponseToValidationResult(apiResponse);
      setValidationResult(result);
      setCurrentStep(4);
    } catch (error) {
      setValidationResult({
        status: 'error',
        summary: 'Validation failed due to a technical error. Please try again.',
        checks: [{
          name: 'API Error',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          status: 'fail',
        }],
        recommendations: ['Please try again or contact support if the problem persists.'],
      });
      setCurrentStep(4);
    } finally {
      setIsValidating(false);
    }
  };

  return {
    selectedFile,
    validationResult,
    isValidating,
    handleFileSelect,
    handleRemoveFile,
    handleValidatePhoto,
    currentStep,
    handleReset,
  };
}
