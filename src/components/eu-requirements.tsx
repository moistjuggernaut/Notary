import { CheckCircle, Baby, FileText } from "lucide-react";

export default function EURequirements() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
            EU Regulations for Baby Passport Photos
          </h2>
          <p className="text-sm text-gray-600">
            European Union requirements based on Regulations 2252/2004 & 444/2009 and ICAO Doc 9303 biometric standards
          </p>
        </div>
        
        <div className="px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
          {/* Photo Quality */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo Quality</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Color photo with neutral lighting (no shadows, no overexposure)</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">High resolution, sharp focus meeting biometric standards</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Plain white or light gray background (no patterns or textures)</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">No red-eye or reflections</span>
              </div>
            </div>
          </div>

          {/* Face Position & Expression */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Face Position & Expression</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Centered face, looking straight at the camera if possible</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">
                  Eyes open and clearly visible <span className="text-xs italic text-gray-500">(exception for infants under 6 months)</span>
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Mouth closed if possible</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Head not tilted, and not supported by a hand or object if possible</span>
              </div>
            </div>
          </div>

          {/* Framing */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Framing</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Full face visible (top of head to chin), no parts cropped</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Both edges of the face should be visible</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">No toys, pacifiers, or hands (including parent hands) in the frame</span>
              </div>
            </div>
          </div>

          {/* EU Specific Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start">
              <FileText className="w-6 h-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  EU Biometric Passport Requirements
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  Under EU Regulations 2252/2004 & 444/2009, all EU member states must issue individual biometric passports:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-blue-800">Individual passport required for each baby (no shared family passports)</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-blue-800">Facial image stored on biometric chip for all ages</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-blue-800">Children under 12 are exempt from fingerprint requirements</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Special Allowances for Babies */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start">
              <Baby className="w-6 h-6 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-800 mb-3">
                  Special Allowances for Babies Under 6 Months
                </h3>
                <p className="text-sm text-emerald-700 mb-4">
                  EU guidelines, following ICAO standards, explicitly note that infants under 6 months:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-emerald-800">May have their eyes closed</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-emerald-800">Do not need a neutral expression (crying is discouraged, but not disqualifying)</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-emerald-800">Can be photographed lying on a white blanket or in a car seat covered with a white cloth</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> This tool validates photos based on EU Regulations 2252/2004 & 444/2009 
                  and ICAO Document 9303 biometric standards that all EU member states follow. 
                  Final photo acceptance is determined by national passport issuing authorities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 