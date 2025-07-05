import Header from "@/components/header";
import { CheckCircle, Upload, Zap, Download } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-slate mb-4">
            How Baby Photo Validation Works
          </h2>
          <p className="text-lg text-slate-grey max-w-2xl mx-auto leading-relaxed">
            Our AI-powered system validates your baby's passport photo against EU biometric standards 
            (Regulations 2252/2004 & 444/2009) with special allowances for infants under 6 months.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-official-blue rounded-full mx-auto mb-6">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-dark-slate mb-4">1. Upload Photo</h3>
            <p className="text-slate-grey leading-relaxed">
              Select or drag and drop your child's passport photo. We support JPG, PNG, and WEBP formats up to 10MB.
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-official-blue rounded-full mx-auto mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-dark-slate mb-4">2. AI Analysis</h3>
            <p className="text-slate-grey leading-relaxed">
              Our AI system analyzes the photo against EU biometric standards, checking facial positioning, background, lighting, and quality.
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-official-blue rounded-full mx-auto mb-6">
              <Download className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-dark-slate mb-4">3. Get Results</h3>
            <p className="text-slate-grey leading-relaxed">
              Receive detailed feedback on compliance issues and download the validation report for your passport application.
            </p>
          </div>
        </div>

        <div className="bg-light-slate rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-semibold text-dark-slate mb-6 flex items-center">
            <CheckCircle className="w-6 h-6 text-success-emerald mr-3" />
            What We Check
          </h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-dark-slate mb-3">Photo Quality</h4>
              <ul className="space-y-2 text-slate-grey">
                <li className="flex items-start">
                  <span className="text-success-emerald mr-2">•</span>
                  High resolution and sharpness
                </li>
                <li className="flex items-start">
                  <span className="text-success-emerald mr-2">•</span>
                  Proper contrast and exposure
                </li>
                <li className="flex items-start">
                  <span className="text-success-emerald mr-2">•</span>
                  No blur or pixelation
                </li>
                <li className="flex items-start">
                  <span className="text-success-emerald mr-2">•</span>
                  Correct file format
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-dark-slate mb-3">Compliance Standards</h4>
              <ul className="space-y-2 text-slate-grey">
                <li className="flex items-start">
                  <span className="text-success-emerald mr-2">•</span>
                  Face position and centering
                </li>
                <li className="flex items-start">
                  <span className="text-success-emerald mr-2">•</span>
                  Head size and dimensions
                </li>
                <li className="flex items-start">
                  <span className="text-success-emerald mr-2">•</span>
                  Background color and uniformity
                </li>
                <li className="flex items-start">
                  <span className="text-success-emerald mr-2">•</span>
                  Expression and eye visibility
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-3">Important Note</h3>
          <p className="text-blue-700 text-sm leading-relaxed">
            This tool is designed to help ensure compliance with EU biometric standards but does not guarantee acceptance 
            by national passport authorities. Always verify requirements with your local passport office. For children under 12 years old, 
            fingerprint requirements are exempt but facial image requirements still apply.
          </p>
        </div>
      </main>
    </div>
  );
}
