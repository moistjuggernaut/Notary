import Header from "@/components/header";
import Footer from "./footer";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: "4xl" | "6xl";
  showFooter?: boolean;
  className?: string;
}

const maxWidthClasses = {
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
};

export default function PageLayout({ 
  children, 
  maxWidth = "6xl", 
  showFooter = false,
  className 
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className={cn(
        "mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12",
        maxWidthClasses[maxWidth],
        className
      )}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

