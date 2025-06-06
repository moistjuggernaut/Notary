import { CheckCircle, User, Camera, Ruler, Ban } from "lucide-react";

export default function ICAORequirements() {
  return (
    <section className="mb-12">
      <div className="bg-light-slate rounded-lg p-8 border border-gray-200">
        <div className="flex items-center mb-6">
          <CheckCircle className="text-success-emerald text-2xl mr-3" />
          <h3 className="text-2xl font-semibold text-dark-slate">ICAO Requirements for Children's Photos</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-start mb-3">
              <User className="text-official-blue text-lg mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-dark-slate mb-2">Head Position & Expression</h4>
                <ul className="text-slate-grey space-y-1 text-sm">
                  <li>• Child looking directly at camera</li>
                  <li>• Neutral expression (mouth closed)</li>
                  <li>• Eyes open and clearly visible</li>
                  <li>• Head centered and straight</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-start mb-3">
              <Ruler className="text-official-blue text-lg mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-dark-slate mb-2">Size & Dimensions</h4>
                <ul className="text-slate-grey space-y-1 text-sm">
                  <li>• 35mm x 45mm (passport size)</li>
                  <li>• Head height: 25-35mm from chin to crown</li>
                  <li>• Eye level: 28-35mm from photo bottom</li>
                  <li>• High resolution (minimum 600 DPI)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-start mb-3">
              <Camera className="text-official-blue text-lg mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-dark-slate mb-2">Background & Lighting</h4>
                <ul className="text-slate-grey space-y-1 text-sm">
                  <li>• Plain white or light grey background</li>
                  <li>• Even lighting, no shadows</li>
                  <li>• No red-eye or glare on glasses</li>
                  <li>• Natural skin tone colors</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-start mb-3">
              <Ban className="text-official-blue text-lg mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-dark-slate mb-2">Not Permitted</h4>
                <ul className="text-slate-grey space-y-1 text-sm">
                  <li>• Hats or head coverings (except religious)</li>
                  <li>• Smiling or open mouth</li>
                  <li>• Other people or objects in frame</li>
                  <li>• Filters or digital alterations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-official-blue">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-official-blue mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-dark-slate">
                <strong>Special Note for Children:</strong> For children under 6, slight variations in expression 
                and head position may be acceptable. Ensure the child's face is clearly visible and recognizable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
