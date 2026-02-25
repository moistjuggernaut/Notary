import { useState } from "react";
import type { ValidationResult } from "@/types/validation";
import { validatePhoto } from "@/api/client";
import { convertApiResponseToValidationResult } from "@/lib/validation-utils";
import { errorMessages } from "@/lib/constants";

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
    } catch {
      const errInfo = errorMessages.INTERNAL_SERVER_ERROR;
      setValidationResult({
        status: 'error',
        summary: errInfo.summary,
        checks: [{ name: 'Unexpected Error', description: errInfo.description, status: 'fail' }],
        recommendations: errInfo.recommendations,
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
