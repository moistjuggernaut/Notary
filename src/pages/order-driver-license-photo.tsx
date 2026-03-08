import IntentLandingPage from "@/components/seo/intent-landing-page";

export default function OrderDriverLicensePhoto() {
  return (
    <IntentLandingPage
      title="Order Driver's License Photo Online | Validate, Download Or Print"
      description="Order driver's license photos online. Upload your photo, check it against the relevant requirements, then download the digital file for free or order printed photos."
      canonicalPath="/order-driver-license-photo"
      eyebrow="Order Driver's License Photos"
      heading="Order Driver's License Photos Online"
      intro="Upload a driver's license photo, validate it against the relevant requirements, then continue with a free digital download or printed photo order."
      supportNote="Free digital download after validation. Printed driver's license photos are available to order."
      primaryCta={{ href: "/validate?docType=drivers_license", label: "Start Driver's License Photo Order" }}
      secondaryCta={{ href: "/validate-driver-license-photo", label: "Validate Driver's License Photo" }}
      benefits={[
        "Connect photo validation and ordering in one driver's license photo flow.",
        "Use the right document format before you choose a free digital download or printed delivery.",
        "Handle driver's license photo ordering online with the same image you upload for validation.",
      ]}
      steps={[
        "Upload the driver's license photo you want to use.",
        "Validate the image against document-specific rules and size requirements.",
        "Download the final digital file for free or order printed driver's license photos online.",
      ]}
      faqs={[
        {
          question: "Can I order driver's license photos online?",
          answer: "Yes. You can upload a photo, validate it, and continue with a free digital download or printed photo order online.",
        },
        {
          question: "Why validate before ordering?",
          answer: "Validation checks the key document rules first, so the image is prepared before you move to download or print ordering.",
        },
        {
          question: "Can I use the same service for passport and driver's license photos?",
          answer: "Yes. The flow supports both document types, with separate validation and sizing rules where needed.",
        },
        {
          question: "Can I upload a photo taken at home?",
          answer: "Yes. If the photo is clear, you can upload it from home, validate it, and order prints online.",
        },
      ]}
      relatedLinks={[
        { href: "/", label: "Passport Photo Homepage" },
        { href: "/validate-driver-license-photo", label: "Validate Driver's License Photo" },
        { href: "/driver-license-photo-requirements", label: "Driver's License Requirements" },
        { href: "/order-passport-photo", label: "Order Passport Photo" },
      ]}
    />
  );
}
