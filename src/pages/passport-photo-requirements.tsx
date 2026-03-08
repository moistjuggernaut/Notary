import IntentLandingPage from "@/components/seo/intent-landing-page";

export default function PassportPhotoRequirementsPage() {
  return (
    <IntentLandingPage
      title="Passport Photo Requirements | ICAO And Country Rules"
      description="Review passport photo requirements, including size, background, framing, and expression. Validate your passport photo online, then download the digital file for free or order prints."
      canonicalPath="/passport-photo-requirements"
      eyebrow="Passport Photo Requirements"
      heading="Passport Photo Requirements"
      intro="Review the main passport photo requirements for size, framing, background, and facial position, then validate your photo online before you download the digital file for free or order prints."
      supportNote="Free digital download after validation. Printed passport photos are available to order."
      primaryCta={{ href: "/validate-passport-photo", label: "Validate Passport Photo" }}
      secondaryCta={{ href: "/requirements", label: "View Full ICAO Guide" }}
      benefits={[
        "Understand the main passport photo rules before you upload.",
        "Use validation to check whether your passport photo matches the required format.",
        "Continue from requirements to a checked photo, free digital download, and final print order in one flow.",
      ]}
      steps={[
        "Review the main passport photo rules for background, lighting, and framing.",
        "Upload your passport photo for validation against the relevant requirements.",
        "Download the digital file for free or order printed passport photos online.",
      ]}
      faqs={[
        {
          question: "What are the main passport photo requirements?",
          answer: "The main rules cover photo size, plain background, even lighting, neutral expression, visible eyes, and correct face positioning.",
        },
        {
          question: "Can I check passport photo requirements online?",
          answer: "Yes. You can review the rules and then validate your passport photo online in the same flow.",
        },
        {
          question: "Do passport photo requirements change by country?",
          answer: "The core biometric rules are similar, but some countries use different passport photo dimensions or document-specific details.",
        },
        {
          question: "Can I order prints after checking the requirements?",
          answer: "Yes. After validation, you can continue with a free digital download or printed passport photo order.",
        },
      ]}
      relatedLinks={[
        { href: "/", label: "Passport Photo Homepage" },
        { href: "/requirements", label: "ICAO Requirements Guide" },
        { href: "/validate-passport-photo", label: "Validate Passport Photo" },
        { href: "/order-passport-photo", label: "Order Passport Photo" },
      ]}
    />
  );
}
