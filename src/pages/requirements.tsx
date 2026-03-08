import { PageLayout } from "@/components/layout";
import { usePageMeta } from "@/hooks/use-page-meta";
import EURequirements from "@/components/eu-requirements";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Requirements() {
  usePageMeta({
    title: "Passport Photo Requirements | ICAO And EU Guide",
    description: "Review the main passport and driver's license photo requirements we check, including size, background, lighting, framing, and facial position.",
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
          Back to Photo Validator
        </Link>
      </div>

      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
          Passport And Driver's License Photo Requirements
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
          Review the core ICAO and EU photo rules we use for passport and driver's license validation, including background, framing, lighting, and document-specific dimensions.
        </p>
      </div>

      <EURequirements />

      <div className="mt-12 bg-success/10 border border-success/30 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ready to Validate Your Photo?
        </h3>
        <p className="text-muted-foreground mb-4">
          Upload your passport or driver's license photo to check the requirements, crop it to size, and continue with a free digital download or print order.
        </p>
        <Button asChild>
          <Link href="/validate">Validate Your Photo</Link>
        </Button>
      </div>
    </PageLayout>
  );
}
