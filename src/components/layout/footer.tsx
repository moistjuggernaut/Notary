import { Container } from "./container";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-16">
      <Container className="py-8 sm:py-12">
        <p className="text-xs text-muted-foreground max-w-3xl mx-auto text-center">
          This tool provides guidance based on EU Regulations 2252/2004 & 444/2009 and ICAO Document 9303. 
          Final photo acceptance is determined by the country's issuing authority. 
          Results are for informational purposes only.
        </p>
      </Container>
    </footer>
  );
}
