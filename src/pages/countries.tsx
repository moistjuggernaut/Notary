import Header from "@/components/header";
import ICAOCountries from "@/components/countries";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Countries() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Validator
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Supported Countries
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Our validator follows ICAO Document 9303 standards, which are adopted by countries worldwide 
            for passport photo requirements.
          </p>
        </div>

        {/* Countries Component */}
        <ICAOCountries />

        {/* Additional Information */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Important Note
          </h3>
          <p className="text-blue-800 mb-4">
            While our validator follows international ICAO standards, each country may have 
            additional specific requirements. Always check with your local passport office 
            for the most current requirements.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Validating Photos
          </Link>
        </div>
      </main>
    </div>
  );
} 