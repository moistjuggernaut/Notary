import type { ValidationResponse } from "@/types/api";
import type { ValidationResult } from "@/types/validation";
import { errorMessages } from "./constants";

export const convertApiResponseToValidationResult = (apiResponse: ValidationResponse): ValidationResult => {
  const { success, status, reason_code, details, orderId, imageUrl } = apiResponse;

  if (success && status === 'COMPLIANT' && reason_code === 'ALL_CHECKS_PASSED') {
    return {
      status: 'success',
      summary: 'Photo meets all EU biometric requirements and is ready for passport application submission.',
      orderId,
      imageUrl,
      sheetUrl: apiResponse.sheetUrl
    };
  }

  const errorInfo = errorMessages[reason_code] || {
    summary: 'Photo validation encountered an issue.',
    description: details?.validator_reason_description || `Validation failed with code: ${reason_code}`,
    recommendations: [
      'Review the photo requirements and try again',
      'If the issue keeps happening, try a different photo'
    ]
  };

  return {
    status: 'error',
    summary: errorInfo.summary,
    checks: [{
      name: 'Validation Issue',
      description: details?.validator_reason_description || errorInfo.description,
      status: 'fail'
    }],
    recommendations: errorInfo.recommendations,
    orderId
  };
};
