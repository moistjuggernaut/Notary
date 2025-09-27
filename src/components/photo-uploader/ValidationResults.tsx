import { CheckCircle, XCircle, AlertTriangle, Download, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ValidationResult } from "@/types/validation";
import { getStatusIcon, getOverallStatus, handleDownload } from "./utils";

interface ValidationResultsProps {
  result: ValidationResult;
}

export default function ValidationResults({ result }: ValidationResultsProps) {
  const groupedChecks = result.checks.reduce((acc, check) => {
    if (!acc[check.category]) {
      acc[check.category] = [];
    }
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, typeof result.checks>);

  const categoryTitles = {
    photo_quality: 'Photo Quality',
    face_position: 'Face Position',
    framing: 'Framing',
    technical: 'Technical'
  };

  const overallStatus = getOverallStatus(result);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-6">
      {/* Overall Status */}
      <div className={`mb-6 p-4 sm:p-6 rounded-lg ${overallStatus.bgColor}`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {overallStatus.icon === '✅' && <CheckCircle className="w-8 h-8 text-emerald-600" />}
            {overallStatus.icon === '❌' && <XCircle className="w-8 h-8 text-red-500" />}
            {overallStatus.icon === '⚠️' && <AlertTriangle className="w-8 h-8 text-amber-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg sm:text-xl font-semibold ${overallStatus.textColor}`}>
              {overallStatus.title}
            </h3>
            <p className={`mt-1 text-sm ${overallStatus.textColor} opacity-90`}>
              {overallStatus.description}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Checks */}
      <div className="space-y-4 mb-6">
        {Object.entries(groupedChecks).map(([category, checks]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
              {categoryTitles[category as keyof typeof categoryTitles]}
            </h4>
            {checks.map((check, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border bg-gray-50">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-sm">{getStatusIcon(check.status)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{check.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{check.description}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Processed Image */}
      {result.imageUrl && (
        <div className="mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Validated Image</h4>
            <div className="flex justify-center">
              <img
                src={result.imageUrl}
                alt="Validated passport photo"
                className="max-w-full max-h-64 rounded-lg shadow-sm border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Download Button */}
      <div className="flex flex-col sm:flex-row gap-3 pb-6 border-b border-gray-200">
        <Button
          className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white h-11"
          onClick={() => handleDownload(result.imageUrl)}
          disabled={!result.imageUrl}
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <form action={`/api/stripe/create-checkout-session?orderId=${result?.orderId || ''}`} method="POST" className="flex-1 sm:flex-none">
          <Button 
            variant="outline" 
            type="submit"
            className="w-full h-11"
            disabled={!result?.orderId}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Checkout
          </Button>
        </form>
      </div>
    </div>
  );
}
