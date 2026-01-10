export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 011-1h2a2 2 0 011 1v2m-4 0a2 2 0 01-2 2h4a2 2 0 01-2-2m-6 4h.01M9 16h.01" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-900">Photo ID Validator</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-500 mb-6">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact Support</a>
          </div>
          <div className="pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 max-w-3xl mx-auto">
              This tool provides guidance based on EU Regulations 2252/2004 & 444/2009 and ICAO Document 9303. 
              Final photo acceptance is determined by national passport issuing authorities. 
              Results are for informational purposes only.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

