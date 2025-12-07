import { useState } from "react";
import type { ValidationResult } from "@/types/validation";
import { validatePhoto, quickCheckPhoto } from "@/api/client";
import type { QuickCheckResponse } from "@/types/api";
import { convertApiResponseToValidationResult } from "@/lib/validation-utils";

export const usePhotoValidation = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Quick check state
  const [isQuickChecking, setIsQuickChecking] = useState(false);
  const [quickCheckResult, setQuickCheckResult] = useState<QuickCheckResponse | null>(null);
  const [quickCheckError, setQuickCheckError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setValidationResult(null);
    setQuickCheckResult(null);
    setQuickCheckError(null);
    setIsQuickChecking(true);

    try {
      const result = await quickCheckPhoto(file);
      setQuickCheckResult(result);
      if (!result.success) {
        setQuickCheckError(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during quick check.';
      setQuickCheckError(errorMessage);
    } finally {
      setIsQuickChecking(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setQuickCheckResult(null);
    setQuickCheckError(null);
  };

  const handleValidatePhoto = async () => {
    if (!quickCheckResult?.success || !quickCheckResult.orderId) return;

    setIsValidating(true);

    try {
      const apiResponse = await validatePhoto(quickCheckResult.orderId);
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
          status: 'fail',
        }],
        recommendations: ['Please try again or contact support if the problem persists.']
      };
      setValidationResult(errorResult);
    } finally {
      setIsValidating(false);
    }
  };

  // Determine if the full validation button should be enabled
  const isValidationAllowed = quickCheckResult?.success === true && !isQuickChecking && !isValidating;

  return {
    selectedFile,
    validationResult,
    isValidating,
    isQuickChecking,
    quickCheckResult,
    quickCheckError,
    handleFileSelect,
    handleRemoveFile,
    handleValidatePhoto,
    isValidationAllowed
  };
};
