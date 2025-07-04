import Header from "@/components/header";
import PhotoUploader from "@/components/photo-uploader";
import { useState } from "react";
import type { ValidationResult } from "@/types/validation";
import { validatePhoto, quickCheckPhoto } from "@/api/client";
import type { ValidationResponse, QuickCheckResponse } from "@/types/api";
import { Link } from "wouter";
import { ExternalLink, FileText, HelpCircle } from "lucide-react";

export default function Home() {
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
      summary = 'Photo does not meet ICAO requirements. Please review the issues below and submit a corrected photo.';
    } else if (hasWarnings) {
      status = 'warning';
      summary = 'Photo mostly meets requirements but has minor issues. Review recommendations for best results.';
    } else {
      status = 'success';
      summary = 'Photo meets all ICAO requirements and is ready for passport application submission.';
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
      processedImage: apiResponse.processed_image
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

  const handleValidateAnother = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setQuickCheckResult(null);
    setQuickCheckError(null);
  };

  // Determine if the full validation button should be enabled
  const isValidationAllowed = quickCheckResult?.success === true && !isQuickChecking && !isValidating;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            ICAO Baby Passport Photo Validator
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
            Ensure your baby's passport photo meets International Civil Aviation Organization (ICAO) standards 
            with special allowances for infants under 6 months.
          </p>

          {/* Quick Navigation */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/how-it-works" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
              <HelpCircle className="w-4 h-4 mr-1" />
              How It Works
            </Link>
            <Link href="/countries" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
              <ExternalLink className="w-4 h-4 mr-1" />
              Supported Countries
            </Link>
            <Link href="/requirements" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
              <FileText className="w-4 h-4 mr-1" />
              ICAO Requirements
            </Link>
          </div>
        </div>

        {/* Main Upload/Validation Component */}
        <div className="mb-12 sm:mb-16">
          <PhotoUploader 
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
            onValidatePhoto={handleValidatePhoto}
            isValidating={isValidating || isQuickChecking}
            isValidationAllowed={isValidationAllowed}
            quickCheckError={quickCheckError}
            validationResult={validationResult}
            onValidateAnother={handleValidateAnother}
          />
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Need Help Getting Started?
          </h3>
          <p className="text-blue-800 mb-4">
            Check our guidelines for taking the perfect baby passport photo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link 
              href="/requirements" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Requirements
            </Link>
            <Link 
              href="/how-it-works" 
              className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              How It Works
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 011-1h2a2 2 0 011 1v2m-4 0a2 2 0 01-2 2h4a2 2 0 01-2-2m-6 4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-900">Photo ID Validator</span>
            </div>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Professional ICAO compliance validation for baby passport photographs with specialized infant requirements.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-500 mb-6">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Contact Support</a>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 max-w-3xl mx-auto">
                This tool provides guidance based on ICAO Document 9303. 
                Final photo acceptance is determined by issuing authorities. 
                Results are for informational purposes only.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
