import { Download, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ValidationResult } from "@/types/validation";
import { getStatusConfig, handleDownload } from "./utils";

interface ValidationResultsProps {
  result: ValidationResult;
}

export default function ValidationResults({ result }: ValidationResultsProps) {
  const statusConfig = getStatusConfig(result.status);

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`p-4 sm:p-6 rounded-lg ${statusConfig.bgColor}`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {statusConfig.Icon && <statusConfig.Icon className={`w-8 h-8 ${statusConfig.iconColor}`} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg sm:text-xl font-semibold ${statusConfig.textColor}`}>
              {statusConfig.title}
            </h3>
            <p className={`mt-1 text-sm ${statusConfig.textColor} opacity-90`}>
              {statusConfig.description}
            </p>
          </div>
        </div>
      </div>

      {/* Validated Image */}
      {result.imageUrl && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-center">
            <img
              src={result.imageUrl}
              alt="Validated passport photo"
              className="max-w-full max-h-96 rounded-lg shadow-md border border-gray-200"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form 
          action={`/api/stripe/create-checkout-session?orderId=${result?.orderId || ''}`} 
          method="POST" 
          className="flex-1 sm:flex-none"
        >
          <Button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-11"
            type="submit"
            disabled={!result?.orderId}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Checkout - €9.99
          </Button>
        </form>

        <Button
          variant="outline"
          className="w-full sm:w-auto h-11"
          onClick={() => handleDownload(result.imageUrl)}
          disabled={!result.imageUrl}
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}
