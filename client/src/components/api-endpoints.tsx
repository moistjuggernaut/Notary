import { Code, Zap, Edit } from "lucide-react";

export default function APIEndpoints() {
  return (
    <section className="mt-16 mb-12">
      <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
        <h3 className="text-2xl font-semibold text-dark-slate mb-6">Developer API Endpoints</h3>
        <p className="text-slate-grey mb-6">This application provides three REST API endpoints for integration:</p>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">POST</span>
              <span className="ml-3 font-mono text-sm">/api/validate</span>
            </div>
            <div className="flex items-start mb-3">
              <Code className="text-official-blue mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-dark-slate mb-2">Validate Photo</h4>
                <p className="text-sm text-slate-grey">Validates uploaded photo against ICAO standards and returns compliance status.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">POST</span>
              <span className="ml-3 font-mono text-sm">/api/preprocess</span>
            </div>
            <div className="flex items-start mb-3">
              <Zap className="text-official-blue mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-dark-slate mb-2">Pre-process Photo</h4>
                <p className="text-sm text-slate-grey">Optimizes photo for validation by adjusting lighting and contrast automatically.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">POST</span>
              <span className="ml-3 font-mono text-sm">/api/modify</span>
            </div>
            <div className="flex items-start mb-3">
              <Edit className="text-official-blue mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-dark-slate mb-2">Modify Photo</h4>
                <p className="text-sm text-slate-grey">Applies corrections to help photos meet ICAO standards while maintaining authenticity.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
