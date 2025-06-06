import { CheckCircle, User, Camera, Baby, Ban } from "lucide-react";

export default function ICAORequirements() {
  return (
    <section className="mb-12">
      <div className="bg-light-slate rounded-lg p-8 border border-gray-200">
        <div className="flex items-center mb-6">
          <CheckCircle className="text-success-emerald text-2xl mr-3" />
          <h3 className="text-2xl font-semibold text-dark-slate">ICAO Requirements for Baby Passport Photos</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-start mb-3">
              <Camera className="text-official-blue text-lg mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-dark-slate mb-2">Photo Quality</h4>
                <ul className="text-slate-grey space-y-1 text-sm">
                  <li>• Color photo with neutral lighting</li>
                  <li>• High resolution, sharp focus</li>
                  <li>• Plain white or light gray background</li>
                  <li>• No red-eye or reflections</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-start mb-3">
              <User className="text-official-blue text-lg mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-dark-slate mb-2">Face Position & Expression</h4>
                <ul className="text-slate-grey space-y-1 text-sm">
                  <li>• Centered face, looking straight at camera</li>
                  <li>• Eyes open and clearly visible</li>
                  <li>• Mouth closed if possible</li>
                  <li>• Head not tilted or supported by hands</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-start mb-3">
              <CheckCircle className="text-official-blue text-lg mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-dark-slate mb-2">Framing</h4>
                <ul className="text-slate-grey space-y-1 text-sm">
                  <li>• Full face visible (top of head to chin)</li>
                  <li>• Both edges of face should be visible</li>
                  <li>• No toys, pacifiers, or hands in frame</li>
                  <li>• No parts of face cropped</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-start mb-3">
              <Ban className="text-official-blue text-lg mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-dark-slate mb-2">Head Coverings & Hair</h4>
                <ul className="text-slate-grey space-y-1 text-sm">
                  <li>• No hats or headbands (except medical/religious)</li>
                  <li>• Eyes must not be obscured by hair</li>
                  <li>• No hands or objects covering face</li>
                  <li>• Face must be clearly visible</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Special Allowances for Babies */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border-l-4 border-success-emerald">
          <div className="flex items-start">
            <Baby className="w-5 h-5 text-success-emerald mt-0.5 mr-3" />
            <div>
              <h4 className="font-semibold text-success-emerald mb-2">Special Allowances for Babies Under 6 Months</h4>
              <p className="text-sm text-dark-slate mb-2">
                ICAO guidelines provide flexibility for infants under 6 months:
              </p>
              <ul className="text-sm text-dark-slate space-y-1">
                <li>• Eyes may be closed</li>
                <li>• Neutral expression not mandatory (crying discouraged but not disqualifying)</li>
                <li>• Can be photographed lying on white blanket or in car seat with white cloth</li>
                <li>• Ensure no shadows or other objects appear in frame</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-official-blue">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-official-blue mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-dark-slate">
                <strong>Important:</strong> This tool provides guidance based on ICAO Document 9303. 
                Final photo acceptance is determined by issuing authorities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
