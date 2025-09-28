import { useState } from "react";
import type { ValidationResult } from "@/types/validation";
import { validatePhoto, quickCheckPhoto } from "@/api/client";
import type { ValidationResponse, QuickCheckResponse } from "@/types/api";

export const usePhotoValidation = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Quick check state
  const [isQuickChecking, setIsQuickChecking] = useState(false);
  const [quickCheckResult, setQuickCheckResult] = useState<QuickCheckResponse | null>(null);
  const [quickCheckError, setQuickCheckError] = useState<string | null>(null);

  // Convert API response to frontend ValidationResult format
  const convertApiResponseToValidationResult = (apiResponse: ValidationResponse): ValidationResult => {
    const allLogs = [...apiResponse.logs.preprocessing, ...apiResponse.logs.validation];

    // Determine overall status
    const hasFailures = allLogs.some(log => log.status === 'FAIL');
    const hasWarnings = allLogs.some(log => log.status === 'WARNING');

    let status: 'success' | 'warning' | 'error';
    let summary: string;

    if (hasFailures) {
      status = 'error';
      summary = 'Photo does not meet EU biometric requirements. Please review the issues below and submit a corrected photo.';
    } else if (hasWarnings) {
      status = 'warning';
      summary = 'Photo mostly meets requirements but has minor issues. Review recommendations for best results.';
    } else {
      status = 'success';
      summary = 'Photo meets all EU biometric requirements and is ready for passport application submission.';
    }

    // Convert logs to checks format with categories
    const categorizeCheck = (step: string): 'photo_quality' | 'face_position' | 'framing' | 'technical' => {
      const stepLower = step.toLowerCase();
      if (stepLower.includes('quality') || stepLower.includes('lighting') || stepLower.includes('exposure')) {
        return 'photo_quality';
      }
      if (stepLower.includes('face') || stepLower.includes('eye') || stepLower.includes('expression')) {
        return 'face_position';
      }
      if (stepLower.includes('frame') || stepLower.includes('crop') || stepLower.includes('position')) {
        return 'framing';
      }
      return 'technical';
    };

    const checks = allLogs
      .filter(log => ['PASS', 'FAIL', 'WARNING'].includes(log.status))
      .map(log => ({
        name: log.step,
        description: log.message,
        status: log.status.toLowerCase() as 'pass' | 'warning' | 'fail',
        category: categorizeCheck(log.step)
      }));

    return {
      status,
      summary,
      checks,
      recommendations: [apiResponse.recommendation].filter(Boolean),
      orderId: apiResponse.orderId,
      imageUrl: apiResponse.imageUrl
    };
  };

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
          category: 'technical'
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
