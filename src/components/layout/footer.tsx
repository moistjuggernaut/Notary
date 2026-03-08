import { Container } from "./container";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-16">
      <Container className="py-8 sm:py-12">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <p className="text-sm text-foreground">
            Validate passport and driver's license photos online, then download the digital file for free or order prints.
          </p>
          <p className="text-xs text-muted-foreground">
            Photo checks are based on EU Regulations 2252/2004 and 444/2009 together with ICAO Document 9303.
            Final acceptance is determined by the issuing authority.
          </p>
        </div>
      </Container>
    </footer>
  );
}
