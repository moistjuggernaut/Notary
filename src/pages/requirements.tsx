import Header from "@/components/header";
import EURequirements from "@/components/eu-requirements";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Requirements() {
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
            EU Photo Requirements
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Complete guide to European Union requirements for baby passport photographs, 
            based on EU Regulations 2252/2004 & 444/2009 and ICAO Doc 9303 biometric standards 
            that all EU member states follow.
          </p>
        </div>

        {/* Requirements Component */}
        <EURequirements />

        {/* Ready to Validate */}
        <div className="mt-12 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Ready to Validate Your Photo?
          </h3>
          <p className="text-green-800 mb-4">
            Now that you understand the EU requirements, upload your baby's photo 
            to check compliance with European biometric passport standards.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Photo Validation
          </Link>
        </div>
      </main>
    </div>
  );
} 