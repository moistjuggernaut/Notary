import IntentLandingPage from "@/components/seo/intent-landing-page";

export default function ValidatePassportPhoto() {
  return (
    <IntentLandingPage
      title="Validate Passport Photo Online | Check ICAO Photo Requirements"
      description="Validate your passport photo online. Check it against ICAO and country photo requirements, then download the digital file for free or order passport photo prints."
      canonicalPath="/validate-passport-photo"
      eyebrow="Passport Photo Validator"
      heading="Validate Your Passport Photo Online"
      intro="Upload a passport photo, check it against ICAO and country requirements, then download the digital file for free or order prints online."
      supportNote="Free digital download after validation. Printed passport photos are available to order."
      primaryCta={{ href: "/validate?docType=passport", label: "Validate Passport Photo" }}
      secondaryCta={{ href: "/passport-photo-requirements", label: "View Passport Photo Requirements" }}
      benefits={[
        "Check passport photo size, background, framing, lighting, and facial position before you submit.",
        "Use the same flow whether you already have a photo or want to finish everything online from home.",
        "Keep moving after validation with a free digital download or a passport photo print order.",
      ]}
      steps={[
        "Upload the passport photo you want to use.",
        "We validate the image against biometric and country-specific passport photo rules.",
        "Download the checked digital photo for free or place an order for printed passport photos.",
      ]}
      faqs={[
        {
          question: "What does passport photo validation check?",
          answer: "It checks the key passport photo rules, including dimensions, background, lighting, expression, and face positioning.",
        },
        {
          question: "Can I order passport photos after validation?",
          answer: "Yes. Once the photo passes the main checks, you can download the digital passport photo for free or order passport photo prints online.",
        },
        {
          question: "Can I validate a passport photo taken at home?",
          answer: "Yes. You can upload a photo taken at home and check whether it matches the required passport photo rules.",
        },
        {
          question: "Does this work for European passport photos?",
          answer: "Yes. The validator is built around ICAO standards and the passport photo dimensions used across European countries.",
        },
      ]}
      relatedLinks={[
        { href: "/", label: "Passport Photo Homepage" },
        { href: "/order-passport-photo", label: "Order Passport Photos" },
        { href: "/requirements", label: "ICAO Photo Requirements" },
        { href: "/validate-driver-license-photo", label: "Validate Driver's License Photo" },
      ]}
    />
  );
}
