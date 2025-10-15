import Header from "@/components/header";
import PhotoUploader from "@/components/photo-uploader";
import { Link } from "wouter";
import { FileText, HelpCircle } from "lucide-react";
import { usePhotoValidation } from "@/hooks/usePhotoValidation";

export default function Home() {
  const {
    selectedFile,
    validationResult,
    isValidating,
    isQuickChecking,
    quickCheckError,
    handleFileSelect,
    handleRemoveFile,
    handleValidatePhoto,
    isValidationAllowed,
    currentStep
  } = usePhotoValidation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            EU Photo ID Validator
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
            Ensure your passport photo meets European Union biometric standards. 
            Valid for all EU member states under Regulations 2252/2004 & 444/2009.
          </p>

          {/* Quick Navigation */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/requirements" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
              <FileText className="w-4 h-4 mr-1" />
              EU Requirements
            </Link>
            <Link href="/how-it-works" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
              <HelpCircle className="w-4 h-4 mr-1" />
              How It Works
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
            currentStep={currentStep}
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
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-500 mb-6">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Contact Support</a>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 max-w-3xl mx-auto">
                This tool provides guidance based on EU Regulations 2252/2004 & 444/2009 and ICAO Document 9303. 
                Final photo acceptance is determined by national passport issuing authorities. 
                Results are for informational purposes only.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
