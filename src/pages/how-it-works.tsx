import { PageLayout } from "@/components/layout";
import { usePageMeta } from "@/hooks/use-page-meta";
import { InfoCard } from "@/components/ui/info-card";
import { Upload, Crop, ShoppingCart } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Upload Your Photo",
    description: "Upload a clear passport or driver's license photo from your phone or computer. We support JPG, PNG, and WEBP files up to 10MB.",
    icon: Upload,
  },
  {
    id: 2,
    title: "Validate And Crop",
    description: "We check the photo against ICAO and country-specific rules for the selected document, then crop it to the required dimensions.",
    icon: Crop,
  },
  {
    id: 3,
    title: "Download Or Order",
    description: "Once the photo is ready, you can download the digital file for free or order printed passport or driver's license photos online.",
    icon: ShoppingCart,
  },
] as const;

export default function HowItWorks() {
  usePageMeta({
    title: "How To Validate A Passport Photo Online",
    description: "See how to validate a passport or driver's license photo online, check the requirements, crop to the right size, download the digital file for free, and order prints.",
    canonicalPath: "/how-it-works",
  });

  return (
    <PageLayout maxWidth="4xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          How Passport Photo Validation Works
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Upload a passport or driver's license photo, validate it against the relevant rules, then finish with a free digital download or printed order.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 mb-16">
        {steps.map((step) => (
          <div key={step.id} className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full mx-auto mb-6">
              <step.icon className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {step.id}. {step.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <InfoCard variant="info" title="Important Note">
        <p className="text-sm leading-relaxed">
          We check the main biometric rules used for passport and driver's license photos, but final acceptance is always decided by the issuing authority.
          For children under 12 years old, fingerprint requirements are exempt, while facial image rules still apply.
        </p>
      </InfoCard>
    </PageLayout>
  );
}
