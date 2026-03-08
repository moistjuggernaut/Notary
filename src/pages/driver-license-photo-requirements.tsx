import IntentLandingPage from "@/components/seo/intent-landing-page";

export default function DriverLicensePhotoRequirementsPage() {
  return (
    <IntentLandingPage
      title="Driver's License Photo Requirements | Check Size And Framing"
      description="Review driver's license photo requirements, including size, framing, background, and expression. Validate your driver's license photo online, then download the digital file for free or order prints if needed."
      canonicalPath="/driver-license-photo-requirements"
      eyebrow="Driver's License Photo Requirements"
      heading="Driver's License Photo Requirements"
      intro="Review the main driver's license photo requirements for size, framing, background, and facial position, then validate your photo online before you download the digital file for free or order prints."
      supportNote="Free digital download after validation. Printed driver's license photos are available to order."
      primaryCta={{ href: "/validate-driver-license-photo", label: "Validate Driver's License Photo" }}
      secondaryCta={{ href: "/requirements", label: "View Full ICAO Guide" }}
      benefits={[
        "See the core driver's license photo rules before you upload your image.",
        "Use document-specific validation where driver's license photo dimensions differ from passport photos.",
        "Move from requirements to validation, free digital download, and ordering without changing tools.",
      ]}
      steps={[
        "Review the main driver's license photo rules for background, lighting, and framing.",
        "Upload your image for validation against the relevant driver's license requirements.",
        "Download the digital file for free or order printed driver's license photos online.",
      ]}
      faqs={[
        {
          question: "What are the main driver's license photo requirements?",
          answer: "The main rules cover size, plain background, even lighting, visible eyes, neutral expression, and correct head position.",
        },
        {
          question: "Are driver's license photo requirements the same as passport photo requirements?",
          answer: "The core biometric rules are similar, but some countries use different photo sizes for driver's licenses.",
        },
        {
          question: "Can I validate a driver's license photo online?",
          answer: "Yes. You can review the requirements and then validate your driver's license photo online.",
        },
        {
          question: "Can I order driver's license photo prints after validation?",
          answer: "Yes. The flow supports both a free digital download and printed photo ordering after validation.",
        },
      ]}
      relatedLinks={[
        { href: "/", label: "Passport Photo Homepage" },
        { href: "/requirements", label: "ICAO Requirements Guide" },
        { href: "/validate-driver-license-photo", label: "Validate Driver's License Photo" },
        { href: "/order-driver-license-photo", label: "Order Driver's License Photo" },
      ]}
    />
  );
}
