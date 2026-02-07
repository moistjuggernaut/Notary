import { PageLayout } from "@/components/layout";
import { usePageMeta } from "@/hooks/use-page-meta";
import EURequirements from "@/components/eu-requirements";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Requirements() {
  usePageMeta(
    "EU Passport Photo Requirements — ICAO Biometric Standards Guide",
    "Complete guide to EU passport photo requirements. Learn about ICAO Doc 9303 biometric standards, photo dimensions, lighting, background, and expression rules.",
  );

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
          EU Passport Photo Requirements
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
          Complete guide to European Union passport photo requirements based on EU Regulations
          2252/2004 & 444/2009 and ICAO Doc 9303 biometric standards.
        </p>
      </div>

      <EURequirements />

      <div className="mt-12 bg-success/10 border border-success/30 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ready to Validate Your Photo?
        </h3>
        <p className="text-muted-foreground mb-4">
          Upload your photo to check compliance with ICAO and EU biometric passport standards.
        </p>
        <Button asChild>
          <Link href="/validate">Start Photo Validation</Link>
        </Button>
      </div>
    </PageLayout>
  );
}
