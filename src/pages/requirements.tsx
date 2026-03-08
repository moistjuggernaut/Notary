import { PageLayout } from "@/components/layout";
import { usePageMeta } from "@/hooks/use-page-meta";
import EURequirements from "@/components/eu-requirements";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Requirements() {
  usePageMeta({
    title: "Renewal Photo Requirements | Passport & Driver's License Guide",
    description: "Review the main rules we check for passport and driver's license renewal photos, including dimensions, background, lighting, and expression.",
    canonicalPath: "/requirements",
  });

  return (
    <PageLayout>
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Validator
        </Link>
      </div>

      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
          Renewal Photo Requirements
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
          Use this guide to understand the main rules we check for passport renewals and driver's license renewals.
          We also crop your photo to the required dimensions for the selected country and document type.
        </p>
      </div>

      <EURequirements />

      <div className="mt-12 bg-success/10 border border-success/30 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ready to Validate Your Photo?
        </h3>
        <p className="text-muted-foreground mb-4">
          Upload your photo to check the requirements, crop it to size, and prepare it for download or ordering.
        </p>
        <Button asChild>
          <Link href="/validate">Check Your Photo</Link>
        </Button>
      </div>
    </PageLayout>
  );
}
