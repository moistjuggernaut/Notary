import { Link, useLocation } from "wouter";
import { Container } from "./container";
import { cn } from "@/lib/utils";

export default function Header() {
  const [location] = useLocation();

  return (
    <header className="bg-background border-b border-border top-0 z-50">
      <Container>
        <div className="flex justify-between items-center py-3 sm:py-4 min-h-16">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
              <img
                src="/favicon.svg"
                alt="Passport Photo Validator"
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
            </div>
            <div className="min-w-0">
              <span className="text-sm sm:text-lg lg:text-xl font-semibold text-foreground truncate block">
                Passport Photo Validator
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground truncate block">
                Validate And Order ID Photos
              </span>
            </div>
          </Link>

          <nav aria-label="Main navigation" className="hidden sm:flex items-center space-x-6">
            <Link
              href="/requirements"
              className={cn(
                "font-medium text-sm transition-colors duration-200",
                location === '/requirements'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              Photo Requirements
            </Link>
            <Link
              href="/how-it-works"
              className={cn(
                "font-medium text-sm transition-colors duration-200",
                location === '/how-it-works'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              How It Works
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  );
}
