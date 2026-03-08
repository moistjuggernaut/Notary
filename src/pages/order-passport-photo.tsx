import IntentLandingPage from "@/components/seo/intent-landing-page";

export default function OrderPassportPhoto() {
  return (
    <IntentLandingPage
      title="Order Passport Photos Online | Validate, Download Or Print"
      description="Order passport photos online after checking them against ICAO and country requirements. Upload a photo, validate it, then download the digital file for free or order prints."
      canonicalPath="/order-passport-photo"
      eyebrow="Order Passport Photos"
      heading="Order Passport Photos Online"
      intro="Upload a passport photo, check it against the relevant requirements, and continue with a free digital download or printed passport photo order."
      supportNote="Free digital download after validation. Printed passport photos are available to order."
      primaryCta={{ href: "/validate?docType=passport", label: "Start Passport Photo Order" }}
      secondaryCta={{ href: "/validate-passport-photo", label: "Validate Passport Photo First" }}
      benefits={[
        "Keep the ordering flow connected to passport photo validation instead of guessing whether the image is ready.",
        "Use one online flow for passport photos you want to download for free or have printed.",
        "Finish a passport photo order without leaving home or starting from a photo booth.",
      ]}
      steps={[
        "Upload the passport photo you want to use.",
        "Check the image against passport photo requirements and dimensions.",
        "Download the final digital file for free or order printed passport photos online.",
      ]}
      faqs={[
        {
          question: "Can I order passport photos online from a photo I already have?",
          answer: "Yes. Upload your existing photo, check it, and continue to a free digital download or print ordering from the same flow.",
        },
        {
          question: "Can I order passport photos after taking the picture at home?",
          answer: "Yes. You can upload a photo taken at home, validate it, and then place a passport photo order online.",
        },
        {
          question: "Do I have to validate the photo before ordering?",
          answer: "Validation comes first so the passport photo can be checked and prepared before you move to download or printed ordering.",
        },
        {
          question: "Can I download the passport photo instead of ordering prints?",
          answer: "Yes. The same flow supports a free digital download as well as printed passport photo ordering.",
        },
      ]}
      relatedLinks={[
        { href: "/", label: "Passport Photo Homepage" },
        { href: "/validate-passport-photo", label: "Validate Passport Photo" },
        { href: "/passport-photo-requirements", label: "Passport Photo Requirements" },
        { href: "/order-driver-license-photo", label: "Order Driver's License Photo" },
      ]}
    />
  );
}
