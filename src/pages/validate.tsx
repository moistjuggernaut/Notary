import { PageLayout } from "@/components/layout";
import { usePageMeta } from "@/hooks/use-page-meta";
import PhotoUploader from "@/components/photo-uploader";
import { usePhotoValidation } from "@/hooks/usePhotoValidation";
import { Button } from "@/components/ui/button";
import { InfoCard } from "@/components/ui/info-card";
import { Link } from "wouter";
import { FileText, HelpCircle } from "lucide-react";
import { getCountryByCode, type DocType } from "@/lib/country-config";

export default function Validate() {
  const params = new URLSearchParams(window.location.search)
  const country = params.get('country') ?? undefined
  const rawDocType = params.get('docType')
  const docType: DocType | undefined =
    rawDocType === 'passport' || rawDocType === 'drivers_license' ? rawDocType : undefined
  const countryName = country ? getCountryByCode(country)?.name : undefined
  const documentLabel = docType === 'drivers_license' ? "driver's license" : "passport"
  const documentLabelTitle = docType === 'drivers_license' ? "Driver's License" : "Passport"

  usePageMeta({
    title: `${documentLabelTitle} Renewal Photo Check | Verify, Crop & Order`,
    description: `Upload your ${documentLabel} renewal photo to check the requirements, crop it to the right size, remove the background if needed, and prepare it for download or ordering.`,
    canonicalPath: "/validate",
  });

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
      <section className="py-4 sm:py-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          {countryName ? `${countryName} ${documentLabelTitle} Photo Check` : `${documentLabelTitle} Photo Check`}
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Upload your photo and we will check the requirements, crop it to the required dimensions,
          and help you finish with a download or printed order.
        </p>
      </section>

      <section className="py-8 sm:py-12">
        <PhotoUploader
          documentLabel={documentLabel}
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
          <p className="mb-4">See the main photo rules we check and how the verification, cropping, and ordering flow works.</p>
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
