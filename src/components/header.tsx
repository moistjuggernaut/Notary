import { Link, useLocation } from "wouter";

export default function Header() {
  const [location] = useLocation();

  return (
    <header className="bg-white border-b border-gray-200 top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4 min-h-16">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 011-1h2a2 2 0 011 1v2m-4 0a2 2 0 01-2 2h4a2 2 0 01-2-2m-6 4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">EU Photo ID Validator</h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">EU Passport Photo Verification</p>
            </div>
          </Link>
          
          <nav className="hidden sm:flex items-center space-x-6">
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
