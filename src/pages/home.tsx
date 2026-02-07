import { PageLayout } from "@/components/layout";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Link } from "wouter";
import { FileText, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import selfieImg from "@/assets/selfie.png";
import validationImg from "@/assets/validation.png";
import shippingImg from "@/assets/shipping.png";

const steps = [
  { title: "Upload Your Photo", description: "Take a selfie or upload an existing photo", image: selfieImg },
  { title: "AI Validation", description: "Checked against EU biometric requirements", image: validationImg },
  { title: "Get Your Result", description: "Receive your validated photo instantly", image: shippingImg },
];

export default function Home() {
  usePageMeta(
    "Passport Photo Validator — Check ICAO & EU Standards Online",
    "Free online passport photo validator. Upload your photo and instantly check it meets ICAO international standards and EU biometric requirements. Works for adults, children, and infants.",
  );

  return (
    <PageLayout>
      <section className="py-6 sm:py-8 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3">
          Passport Photo Validator
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-6">
          Ensure your passport photo meets ICAO international standards and European Union biometric requirements.
          Valid for all EU member states under Regulations 2252/2004 & 444/2009.
        </p>
        <Button asChild size="lg" className="text-lg px-8 py-6">
          <Link href="/validate">
            Start Validating
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
      </section>

      <section className="py-4 sm:py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col items-center text-center">
              <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center border border-border mb-4 overflow-hidden">
                <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button variant="outline" asChild className="h-20 text-base">
            <Link href="/requirements">
              <FileText className="w-5 h-5 mr-2" />
              EU Requirements
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-20 text-base">
            <Link href="/how-it-works">
              <HelpCircle className="w-5 h-5 mr-2" />
              How It Works
            </Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
}
