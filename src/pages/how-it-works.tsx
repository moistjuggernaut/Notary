import { PageLayout } from "@/components/layout";
import { InfoCard } from "@/components/ui/info-card";
import { Upload, Zap, Download } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Upload Photo",
    description: "Select or drag and drop your passport photo. We support JPG, PNG, and WEBP formats up to 10MB.",
    icon: Upload,
  },
  {
    id: 2,
    title: "AI Analysis",
    description: "Our AI system analyzes the photo against EU biometric standards, checking facial positioning, background, lighting, and quality.",
    icon: Zap,
  },
  {
    id: 3,
    title: "Get Results",
    description: "Receive detailed feedback on compliance issues and download the validation report for your passport application.",
    icon: Download,
  },
] as const;

export default function HowItWorks() {
  return (
    <PageLayout maxWidth="4xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          How Photo Validation Works
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Our AI-powered system validates passport photos against EU biometric standards 
          (Regulations 2252/2004 & 444/2009) with special allowances for children and infants.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 mb-16">
        {steps.map((step) => (
          <div key={step.id} className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mx-auto mb-6">
              <step.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {step.id}. {step.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <InfoCard variant="info" title="Important Note">
        <p className="text-sm leading-relaxed">
          This tool is designed to help ensure compliance with EU biometric standards but does not guarantee acceptance 
          by national passport authorities. Always verify requirements with your local passport office. For children under 12 years old, 
          fingerprint requirements are exempt but facial image requirements still apply.
        </p>
      </InfoCard>
    </PageLayout>
  );
}
