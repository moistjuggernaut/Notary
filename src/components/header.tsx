import { Link, useLocation } from "wouter";

export default function Header() {
  const [location] = useLocation();

  return (
    <header className="bg-white border-b border-gray-200 top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <span className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 truncate block">
                Passport Photo Validator
              </span>
              <span className="text-xs sm:text-sm text-gray-600 truncate block">
                ICAO & EU Compliance Check
              </span>
            </div>
          </Link>

          <nav aria-label="Main navigation" className="hidden sm:flex items-center space-x-6">
            <Link
              href="/requirements"
              className={`font-medium text-sm transition-colors duration-200 ${
                location === '/requirements'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Requirements
            </Link>
            <Link
              href="/how-it-works"
              className={`font-medium text-sm transition-colors duration-200 ${
                location === '/how-it-works'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              How It Works
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
