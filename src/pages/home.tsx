import { useEffect } from "react";
import Header from "@/components/header";
import { Footer } from "@/components/layout";
import { Link } from "wouter";
import { FileText, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/ui/page-section";
import selfieImg from "@/assets/selfie.png";
import validationImg from "@/assets/validation.png";
import shippingImg from "@/assets/shipping.png";

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleStartValidating = () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  };

  const steps = [
    {
      number: 1,
      title: "Upload Your Photo",
      description: "Take a selfie or upload an existing photo",
      image: selfieImg
    },
    {
      number: 2,
      title: "AI Validation",
      description: "Checked against EU biometric requirements",
      image: validationImg
    },
    {
      number: 3,
      title: "Get Your Result",
      description: "Receive your validated photo instantly",
      image: shippingImg
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageSection className="py-6 sm:py-8">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">
              EU Photo ID Validator
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-6">
              Ensure your passport photo meets European Union biometric standards. 
              Valid for all EU member states under Regulations 2252/2004 & 444/2009.
            </p>
            
            {/* CTA Button */}
            <Button asChild size="lg" className="text-lg px-8 py-6" onClick={handleStartValidating}>
              <Link href="/validate">
                Start Validating
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </PageSection>

        {/* Steps Visualization */}
        <PageSection className="py-4 sm:py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                {/* Step Image */}
                <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300 mb-4 overflow-hidden">
                  <img 
                    src={step.image} 
                    alt={step.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Step Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </PageSection>

        {/* Mobile CTA Button */}
        <PageSection className="py-4 sm:hidden">
          <div className="text-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 w-full" onClick={handleStartValidating}>
              <Link href="/validate">
                Start Validating
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </PageSection>

        {/* Quick Links */}
        <PageSection className="py-6 sm:py-8">
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
        </PageSection>
      </main>

      <Footer />
    </div>
  );
}
