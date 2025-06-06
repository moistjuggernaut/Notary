import Header from "@/components/header";
import ICAORequirements from "@/components/icao-requirements";
import PhotoUploader from "@/components/photo-uploader";
import ValidationResults from "@/components/validation-results";
import APIEndpoints from "@/components/api-endpoints";
import { useState } from "react";

export interface ValidationResult {
  status: 'success' | 'warning' | 'error';
  score: number;
  checks: {
    name: string;
    description: string;
    score: number;
    status: 'pass' | 'warning' | 'fail';
  }[];
  recommendations?: string[];
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setValidationResult(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationResult(null);
  };

  const handleValidatePhoto = async () => {
    if (!selectedFile) return;
    
    setIsValidating(true);
    
    // Simulate validation API call
    setTimeout(() => {
      const mockResult: ValidationResult = {
        status: 'success',
        score: 92,
        checks: [
          {
            name: 'Background Quality',
            description: 'White background detected, meets requirements',
            score: 98,
            status: 'pass'
          },
          {
            name: 'Face Detection',
            description: 'Face properly centered and sized',
            score: 95,
            status: 'pass'
          },
          {
            name: 'Image Resolution',
            description: 'Resolution acceptable but could be higher for optimal quality',
            score: 78,
            status: 'warning'
          },
          {
            name: 'Lighting & Shadows',
            description: 'Even lighting, no harsh shadows detected',
            score: 92,
            status: 'pass'
          }
        ],
        recommendations: [
          'Consider taking photo with higher resolution camera',
          'Ensure consistent lighting across face'
        ]
      };
      
      setValidationResult(mockResult);
      setIsValidating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-slate mb-4">
            ICAO Children's Passport Photo Validator
          </h2>
          <p className="text-lg text-slate-grey max-w-2xl mx-auto leading-relaxed">
            Ensure your child's passport photo meets International Civil Aviation Organization (ICAO) standards 
            for official document acceptance worldwide.
          </p>
        </div>

        {/* ICAO Requirements */}
        <ICAORequirements />

        {/* Photo Uploader */}
        <PhotoUploader 
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          onValidatePhoto={handleValidatePhoto}
          isValidating={isValidating}
        />

        {/* Validation Results */}
        {validationResult && (
          <ValidationResults 
            result={validationResult}
            onValidateAnother={() => {
              setSelectedFile(null);
              setValidationResult(null);
            }}
          />
        )}

        {/* API Endpoints */}
        <APIEndpoints />
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
            <p className="text-slate-grey mb-6">Ensuring ICAO compliance for children's passport photographs worldwide.</p>
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
