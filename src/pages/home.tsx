import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Link, useLocation } from "wouter";
import { FileText, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountrySelectModal } from "@/components/CountrySelectModal";
import type { DocType } from "@/lib/country-config";
import selfieImg from "@/assets/selfie.png";
import validationImg from "@/assets/validation.png";
import shippingImg from "@/assets/shipping.png";

const steps = [
  { title: "Upload Your Photo", description: "Take a clear photo or upload one you already have.", image: selfieImg },
  { title: "Check And Crop", description: "We verify the requirements and crop to the right size for the selected country and document.", image: validationImg },
  { title: "Download Or Order", description: "Remove the background if needed, then download or order printed photos online.", image: shippingImg },
];

const faqs = [
  {
    question: "Can I use this for passport renewals?",
    answer: "Yes. We check your photo against country-specific passport requirements, crop it to size, and let you order online.",
  },
  {
    question: "Can I use this for driver's license renewals?",
    answer: "Yes. The service also supports driver's license renewal photos, including country-specific size checks where needed.",
  },
  {
    question: "Do you crop the photo for me?",
    answer: "Yes. Once you select the country and document type, we crop the photo to the required dimensions.",
  },
  {
    question: "What if my background is not suitable?",
    answer: "You can remove the background before downloading or ordering if the original background is not good enough.",
  },
] as const;

export default function Home() {
  const [, navigate] = useLocation()
  const [modalOpen, setModalOpen] = useState(false)

  function handleConfirm(country: string, docType: DocType) {
    setModalOpen(false)
    navigate(`/validate?country=${country}&docType=${docType}`)
  }

  usePageMeta({
    title: "Passport & Driver's License Renewal Photos | Verify, Crop & Order",
    description: "Check if your passport or driver's license renewal photo meets country requirements. Verify compliance, crop to the required size, remove the background if needed, and order online.",
    canonicalPath: "/",
  });

  return (
    <PageLayout>
      <section className="py-6 sm:py-8 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3">
          Verify And Order Renewal Photos
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-6">
          Check renewal photos for passports and driver's licenses, crop them to the required dimensions,
          remove the background if needed, and order online. Built for European country requirements and clear, practical results.
        </p>
        <Button size="lg" className="text-lg px-8 py-6" onClick={() => setModalOpen(true)}>
          Check Your Photo
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <CountrySelectModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirm}
        />
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
              Photo Requirements
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

      <section className="py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-3">
            Common Questions
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Straight answers about renewal photos, cropping, background cleanup, and ordering.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-border bg-card p-5 text-left">
                <h3 className="text-base font-semibold text-foreground mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
