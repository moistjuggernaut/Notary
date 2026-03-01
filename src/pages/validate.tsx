import { PageLayout } from "@/components/layout";
import { usePageMeta } from "@/hooks/use-page-meta";
import PhotoUploader from "@/components/photo-uploader";
import { usePhotoValidation } from "@/hooks/usePhotoValidation";
import { Button } from "@/components/ui/button";
import { InfoCard } from "@/components/ui/info-card";
import { Link } from "wouter";
import { FileText, HelpCircle } from "lucide-react";
import type { DocType } from "@/lib/country-config";

export default function Validate() {
  usePageMeta(
    "Validate Your Passport Photo — Free Online ICAO Checker",
    "Upload your passport photo for instant AI-powered validation against ICAO and EU biometric standards. Get results in seconds.",
  );

  const params = new URLSearchParams(window.location.search)
  const country = params.get('country') ?? undefined
  const rawDocType = params.get('docType')
  const docType: DocType | undefined =
    rawDocType === 'passport' || rawDocType === 'drivers_license' ? rawDocType : undefined

  const {
    selectedFile,
    validationResult,
    isValidating,
    handleFileSelect,
    handleRemoveFile,
    handleValidatePhoto,
    currentStep,
    handleReset,
  } = usePhotoValidation({ country, docType });

  return (
    <PageLayout>
      <section className="py-8 sm:py-12">
        <PhotoUploader
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          onValidatePhoto={handleValidatePhoto}
          isValidating={isValidating}
          validationResult={validationResult}
          currentStep={currentStep}
          onReset={handleReset}
        />
      </section>

      <section className="py-8 sm:py-12">
        <InfoCard variant="info" className="text-center">
          <h3 className="text-lg font-semibold mb-2">Need Help Getting Started?</h3>
          <p className="mb-4">Check our guidelines for taking the perfect passport photo.</p>
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
      </section>
    </PageLayout>
  );
}
