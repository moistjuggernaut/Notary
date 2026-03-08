import { PageLayout } from "@/components/layout";
import { usePageMeta } from "@/hooks/use-page-meta";
import { InfoCard } from "@/components/ui/info-card";
import { Upload, Crop, ShoppingCart } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Upload Photo",
    description: "Upload a clear photo for your passport or driver's license renewal. We support JPG, PNG, and WEBP files up to 10MB.",
    icon: Upload,
  },
  {
    id: 2,
    title: "Check And Crop",
    description: "We verify the requirements for the selected country and document, then crop the photo to the required dimensions.",
    icon: Crop,
  },
  {
    id: 3,
    title: "Download Or Order",
    description: "If the photo works, you can remove the background if needed, download it, or order printed photos online.",
    icon: ShoppingCart,
  },
] as const;

export default function HowItWorks() {
  usePageMeta({
    title: "How Renewal Photo Checking Works | Verify, Crop & Order",
    description: "See how we check passport and driver's license renewal photos, crop them to the required size, offer background cleanup, and let you order online.",
    canonicalPath: "/how-it-works",
  });

  return (
    <PageLayout maxWidth="4xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          How Renewal Photo Checking Works
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We check whether your passport or driver's license renewal photo meets the relevant rules,
          crop it to the right size, and help you finish with a download or printed order.
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
          This tool helps you check the common biometric rules used for passport renewals and many driver's license renewals,
          but final acceptance is always decided by the issuing authority. For children under 12 years old, fingerprint
          requirements are exempt, but facial image requirements still apply.
        </p>
      </InfoCard>
    </PageLayout>
  );
}
