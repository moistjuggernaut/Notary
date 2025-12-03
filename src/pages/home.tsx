import Header from "@/components/header";
import { Footer } from "@/components/layout";
import PhotoUploader from "@/components/photo-uploader";
import { Link } from "wouter";
import { FileText, HelpCircle } from "lucide-react";
import { usePhotoValidation } from "@/hooks/usePhotoValidation";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/ui/page-section";
import { InfoCard } from "@/components/ui/info-card";

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
    currentStep,
    handleReset
  } = usePhotoValidation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageSection>
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              EU Photo ID Validator
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Ensure your passport photo meets European Union biometric standards. 
              Valid for all EU member states under Regulations 2252/2004 & 444/2009.
            </p>

            {/* Quick Navigation */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Button variant="link" asChild>
                <Link href="/requirements">
                  <FileText />
                  EU Requirements
                </Link>
              </Button>
              <Button variant="link" asChild>
                <Link href="/how-it-works">
                  <HelpCircle />
                  How It Works
                </Link>
              </Button>
            </div>
          </div>
        </PageSection>

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
              Check our guidelines for taking the perfect baby passport photo.
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
