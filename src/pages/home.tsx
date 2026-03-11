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
  {
    title: "Upload A Photo",
    description: "Use a photo you already have or take one and upload it in a few seconds.",
    image: selfieImg,
  },
  {
    title: "Validate The Requirements",
    description: "Check passport and driver's license photos against ICAO and country-specific rules.",
    image: validationImg,
  },
  {
    title: "Download Or Order Prints",
    description: "Download the digital file for free or order printed passport and driver's license photos online.",
    image: shippingImg,
  },
];

const faqs = [
  {
    question: "Can I validate a passport photo online?",
    answer: "Yes. Upload a passport photo, check it against the main requirements, then download the digital file for free or continue with a print order.",
  },
  {
    question: "Can I validate a driver's license photo online?",
    answer: "Yes. The same flow supports driver's license photos, including country-aware dimensions where they differ, with a free digital download if the photo is ready.",
  },
  {
    question: "Can I order passport photos after validation?",
    answer: "Yes. After the photo passes the main checks, you can download the digital file for free or order printed passport photos online.",
  },
  {
    question: "Does this work for photos taken anywhere?",
    answer: "Yes. You can upload a clear photo taken anywhere, validate it, and finish with a digital file or printed order.",
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
    title: "Validate Passport And Driver's License Photos Online",
    description: "Validate passport and driver's license photos online. Check your photo against ICAO and country requirements, then download the digital file for free or order prints.",
    canonicalPath: "/",
  });

  return (
    <PageLayout>
      <section className="py-6 sm:py-8 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3">
          Validate Passport Photos And Order Prints Online
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-6">
          Upload your passport or driver's license photo, check it against ICAO and local country rules, then get a free digital download or place a print order.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="text-lg px-8 py-6" onClick={() => setModalOpen(true)}>
            Validate Your Photo
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
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
              ICAO Photo Requirements
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-20 text-base">
            <Link href="/how-it-works">
              <HelpCircle className="w-5 h-5 mr-2" />
              How Photo Validation Works
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
            Straight answers about validating passport photos, checking driver's license photos, and ordering prints online.
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
