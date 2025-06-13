import Header from "@/components/header";
import ICAORequirements from "@/components/icao-requirements";
import PhotoUploader from "@/components/photo-uploader";
import ValidationResults from "@/components/validation-results";
import { useState } from "react";
import ICAOCountries from "@/components/countries";
import type { ValidationResult } from "@/types/validation";
import { validatePhoto, quickCheckPhoto } from "@/api/client";
import type { ValidationResponse, QuickCheckResponse } from "@/types/api";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // New state for the quick check
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
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during quick check.';
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

  // Convert API response to frontend ValidationResult format
  const convertApiResponseToValidationResult = (apiResponse: ValidationResponse): ValidationResult => {
    const allLogs = [...apiResponse.logs.preprocessing, ...apiResponse.logs.validation];
    
    // Determine overall status
    const hasFailures = allLogs.some(log => log.status === 'FAIL');
    const hasWarnings = allLogs.some(log => log.status === 'WARNING');
    
    let status: 'success' | 'warning' | 'error';
    if (hasFailures) {
      status = 'error';
    } else if (hasWarnings) {
      status = 'warning';
    } else {
      status = 'success';
    }

    // Calculate overall score (simplified)
    const totalChecks = allLogs.filter(log => ['PASS', 'FAIL', 'WARNING'].includes(log.status)).length;
    const passedChecks = allLogs.filter(log => log.status === 'PASS').length;
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    // Convert logs to checks format
    const checks = allLogs
      .filter(log => ['PASS', 'FAIL', 'WARNING'].includes(log.status))
      .map(log => ({
        name: log.step,
        description: log.message,
        score: log.status === 'PASS' ? 100 : log.status === 'WARNING' ? 70 : 0,
        status: log.status.toLowerCase() as 'pass' | 'warning' | 'fail'
      }));

    return {
      status,
      score,
      checks,
      recommendations: [apiResponse.recommendation]
    };
  };

  const handleValidatePhoto = async () => {
    if (!selectedFile || !quickCheckResult?.success) return;
    
    setIsValidating(true);
    
    try {
      const apiResponse = await validatePhoto(selectedFile);
      const validationResultData = convertApiResponseToValidationResult(apiResponse);
      setValidationResult(validationResultData);
    } catch (error) {
      console.error('Validation failed:', error);
      const errorResult: ValidationResult = {
        status: 'error',
        score: 0,
        checks: [{
          name: 'API Error',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          score: 0,
          status: 'fail'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-slate mb-6">
            ICAO Baby Passport Photo Validator
          </h2>
          <p className="text-xl text-slate-grey max-w-3xl mx-auto leading-relaxed">
            Ensure your baby's passport photo meets International Civil Aviation Organization (ICAO) standards 
            with special allowances for infants under 6 months.
          </p>
        </div>
        

        {/* ICAO Requirements */}
        <ICAORequirements />

        <ICAOCountries />
        
        {/* Photo Uploader */}
        <PhotoUploader 
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          onValidatePhoto={handleValidatePhoto}
          isValidating={isValidating || isQuickChecking}
          isValidationAllowed={isValidationAllowed}
          quickCheckError={quickCheckError}
        />

        {/* Validation Results */}
        {validationResult && (
          <ValidationResults 
            result={validationResult}
            onValidateAnother={() => {
              setSelectedFile(null);
              setValidationResult(null);
              setQuickCheckResult(null);
              setQuickCheckError(null);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-light-slate border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-official-blue rounded-lg mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 011-1h2a2 2 0 011 1v2m-4 0a2 2 0 01-2 2h4a2 2 0 01-2-2m-6 4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-dark-slate">Photo ID Validator</span>
            </div>
            <p className="text-slate-grey mb-6">Ensuring ICAO compliance for baby passport photographs with special infant allowances.</p>
            <div className="flex justify-center space-x-6 text-sm text-slate-grey">
              <a href="#" className="hover:text-official-blue transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-official-blue transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-official-blue transition-colors">Contact Support</a>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-slate-grey">
                This tool provides guidance based on ICAO Document 9303. 
                Final photo acceptance is determined by issuing authorities.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
