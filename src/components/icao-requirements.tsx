import { CheckCircle, Baby } from "lucide-react";

export default function ICAORequirements() {
  return (
    <section className="mb-12">
      <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-sm">
        <h3 className="text-2xl font-semibold text-dark-slate mb-8">ICAO Requirements for Baby Passport Photos</h3>
        
        <div className="space-y-8">
          {/* Photo Quality */}
          <div>
            <h4 className="text-lg font-semibold text-dark-slate mb-4">Photo Quality</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-grey">Color photo with neutral lighting (no shadows, no overexposure)</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-grey">High resolution, sharp focus</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-grey">Plain white or light gray background (no patterns or textures)</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-grey">No red-eye or reflections</span>
              </div>
            </div>
          </div>

          {/* Face Position & Expression */}
          <div>
            <h4 className="text-lg font-semibold text-dark-slate mb-4">Face Position & Expression</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-grey">Centered face, looking straight at the camera</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-grey">Eyes open and clearly visible <span className="text-sm italic">(exception for newborns)</span></span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-grey">Mouth closed if possible (not crying or smiling)</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-grey">Head not tilted, and not supported by a hand or object if possible</span>
              </div>
            </div>
          </div>

          {/* Framing */}
          <div>
            <h4 className="text-lg font-semibold text-dark-slate mb-4">Framing</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-grey">Full face visible (top of head to chin), no parts cropped</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-grey">Both edges of the face should be visible</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-grey">No toys, pacifiers, or hands (including parent hands) in the frame</span>
              </div>
            </div>
          </div>
        </div>

        {/* Special Allowances for Babies */}
        <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start">
            <Baby className="w-6 h-6 text-success-emerald mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-semibold text-success-emerald mb-3">Special Allowances for Babies Under 6 Months</h4>
              <p className="text-sm text-dark-slate mb-3">
                ICAO guidelines explicitly note that infants under 6 months:
              </p>
              <div className="space-y-2">
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-success-emerald mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm text-dark-slate">May have their eyes closed</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-success-emerald mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm text-dark-slate">Do not need a neutral expression (crying is discouraged, but not disqualifying)</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-success-emerald mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm text-dark-slate">Can be photographed lying on a white blanket or in a car seat covered with a white cloth</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This tool provides guidance based on ICAO Document 9303. 
            Final photo acceptance is determined by issuing authorities.
          </p>
        </div>
      </div>
    </section>
  );
}
