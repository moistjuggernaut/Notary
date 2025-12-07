import { useEffect } from "react";
import Header from "@/components/header";
import { Footer } from "@/components/layout";
import PhotoUploader from "@/components/photo-uploader";
import { usePhotoValidation } from "@/hooks/usePhotoValidation";
import { PageSection } from "@/components/ui/page-section";
import { InfoCard } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, HelpCircle } from "lucide-react";

export default function Validate() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    currentStep,
    handleReset
  } = usePhotoValidation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Upload/Validation Component */}
        <PageSection>
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
            onReset={handleReset}
          />
        </PageSection>

        {/* Quick Tips */}
        <PageSection>
          <InfoCard variant="info" className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Need Help Getting Started?
            </h3>
            <p className="mb-4">
              Check our guidelines for taking the perfect passport photo.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/requirements">
                  <FileText className="w-4 h-4" />
                  View Requirements
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/how-it-works">
                  <HelpCircle className="w-4 h-4" />
                  How It Works
                </Link>
              </Button>
            </div>
          </InfoCard>
        </PageSection>
      </main>

      <Footer />
    </div>
  );
}
