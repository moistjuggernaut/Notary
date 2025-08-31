import { CheckCircle, Baby, FileText, Users } from "lucide-react";

export default function EURequirements() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}

        <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-6 space-y-8">
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
                <span className="text-gray-700 text-sm sm:text-base">Centered face, looking straight at the camera</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Both eyes open and clearly visible</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Neutral facial expression (mouth closed, no smiling)</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Head not tilted, no support from hands or objects</span>
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
                <span className="text-gray-700 text-sm sm:text-base">No hats or head coverings (except religious/medical reasons)</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Glasses allowed if clear, thin-framed, no glare, eyes fully visible</span>
              </div>
            </div>
          </div>

          {/* Children Under 10 (Relaxed Standards) */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start">
              <Users className="w-6 h-6 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-800 mb-3">
                  Children Under 10 (Relaxed Standards)
                </h3>
                <p className="text-sm text-amber-700 mb-4">
                  ICAO guidelines provide flexibility for photographing young children:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-amber-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-amber-800">Slight smile or slightly open mouth often accepted</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-amber-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-amber-800">Head position more flexible (doesn't need to be perfectly straight)</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-amber-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-amber-800">Eyes visible but don't need perfect horizontal alignment</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-amber-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-amber-800">No toys, pacifiers, or other objects in the frame</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Babies & Infants Under 1 Year */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start">
              <Baby className="w-6 h-6 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-800 mb-3">
                  Babies & Infants Under 1 Year (Maximum Flexibility)
                </h3>
                <p className="text-sm text-emerald-700 mb-4">
                  EU guidelines following ICAO standards provide special allowances for very young infants:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-emerald-800">Eyes do not need to be open</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-emerald-800">Non-neutral expression tolerated (crying discouraged but not disqualifying)</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-emerald-800">Can be photographed lying on white blanket or in car seat with white cloth</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-emerald-800">No other people or objects (toys, pacifiers) in the photo</span>
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
                  <strong>Important:</strong> This tool validates photos based on{" "}
                  <a href="https://eur-lex.europa.eu/eli/reg/2004/2252/oj" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
                    EU Regulation 2252/2004
                  </a>
                  {" "}and{" "}
                  <a href="https://eur-lex.europa.eu/eli/reg/2009/444/oj" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
                    EU Regulation 444/2009
                  </a>
                  , along with{" "}
                  <a href="https://www.icao.int/publications/pages/publication.aspx?docnum=9303" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
                    ICAO Document 9303
                  </a>{" "}
                  biometric standards that all EU member states follow.
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