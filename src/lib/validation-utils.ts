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

  const errorInfo = errorMessages[reason_code] ?? errorMessages.INTERNAL_SERVER_ERROR;

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
