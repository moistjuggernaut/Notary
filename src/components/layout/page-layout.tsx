import Header from "./header";
import Footer from "./footer";
import { Container } from "./container";
import { cn } from "@/lib/utils";

type PageLayoutProps = {
  children: React.ReactNode;
  maxWidth?: "4xl" | "6xl";
  showFooter?: boolean;
  className?: string;
};

export default function PageLayout({ 
  children, 
  maxWidth = "6xl", 
  showFooter = true,
  className,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <main>
        <Container maxWidth={maxWidth} className={cn("py-8 sm:py-12", className)}>
          {children}
        </Container>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
