import { useState, useEffect } from "react";
import type { ValidationResult } from "@/types/validation";
import { validatePhoto } from "@/api/client";
import { convertApiResponseToValidationResult } from "@/lib/validation-utils";

export const usePhotoValidation = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Auto-advance to step 2 when file is selected
  useEffect(() => {
    if (selectedFile && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [selectedFile, currentStep]);

  // Auto-advance to step 3 when validation starts
  useEffect(() => {
    if (isValidating && currentStep === 2) {
      setCurrentStep(3);
    }
  }, [isValidating, currentStep]);

  // Auto-advance to step 4 when validation completes
  useEffect(() => {
    if (validationResult && currentStep === 3) {
      setCurrentStep(4);
    }
  }, [validationResult, currentStep]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setValidationResult(null);
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

    try {
      const apiResponse = await validatePhoto(selectedFile);
      const validationResultData = convertApiResponseToValidationResult(apiResponse);
      setValidationResult(validationResultData);
    } catch (error) {
      console.error('Validation failed:', error);
      const errorResult: ValidationResult = {
        status: 'error',
        summary: 'Validation failed due to a technical error. Please try again or contact support if the problem persists.',
        checks: [{
          name: 'API Error',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          status: 'fail'
        }],
        recommendations: ['Please try again or contact support if the problem persists.']
      };
      setValidationResult(errorResult);
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
    handleReset
  };
};
