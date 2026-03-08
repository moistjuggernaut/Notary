import IntentLandingPage from "@/components/seo/intent-landing-page";

export default function ValidateDriverLicensePhoto() {
  return (
    <IntentLandingPage
      title="Validate Driver's License Photo Online | Check Photo Requirements"
      description="Validate your driver's license photo online. Check size, framing, background, and biometric requirements before you download the digital file for free or order prints."
      canonicalPath="/validate-driver-license-photo"
      eyebrow="Driver's License Photo Check"
      heading="Validate Your Driver's License Photo Online"
      intro="Upload a driver's license photo, check it against the relevant photo requirements, then download the digital file for free or order prints online."
      supportNote="Free digital download after validation. Printed driver's license photos are available to order."
      primaryCta={{ href: "/validate?docType=drivers_license", label: "Validate Driver's License Photo" }}
      secondaryCta={{ href: "/driver-license-photo-requirements", label: "View Driver's License Requirements" }}
      benefits={[
        "Check the main driver's license photo requirements before you submit your application photo.",
        "Use country-aware dimensions where they differ from standard passport photo formats.",
        "Move from validation to a free digital download or print ordering without starting over.",
      ]}
      steps={[
        "Upload the driver's license photo you want to check.",
        "We validate the image against the selected document rules and crop dimensions.",
        "Download the checked digital image for free or order printed photos online.",
      ]}
      faqs={[
        {
          question: "Can I verify a driver's license photo online?",
          answer: "Yes. You can upload your image and check the main driver's license photo rules online before using it.",
        },
        {
          question: "Do driver's license photos use the same size as passport photos?",
          answer: "Not always. Some countries use different driver's license photo dimensions, which is why document selection matters.",
        },
        {
          question: "Can I order prints after validating a driver's license photo?",
          answer: "Yes. After validation, you can keep the digital file for free download or place a print order online.",
        },
        {
          question: "Can I use a photo taken at home?",
          answer: "Yes. A clear photo taken at home can be validated as long as it meets the relevant lighting, background, and framing rules.",
        },
      ]}
      relatedLinks={[
        { href: "/", label: "Passport Photo Homepage" },
        { href: "/validate-passport-photo", label: "Validate Passport Photo" },
        { href: "/driver-license-photo-requirements", label: "Driver's License Requirements" },
        { href: "/how-it-works", label: "How Validation Works" },
      ]}
    />
  );
}
