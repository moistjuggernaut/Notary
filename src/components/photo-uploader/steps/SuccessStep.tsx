import { CheckCircle, Download, CreditCard, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepActions } from "@/components/ui/step-actions";
import { InfoCard } from "@/components/ui/info-card";
import { handleDownload } from "../utils";
import type { ValidationResult } from "@/types/validation";

interface SuccessStepProps {
  result: ValidationResult;
  onUploadNew: () => void;
}

export default function SuccessStep({ result, onUploadNew }: SuccessStepProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12">
      {/* Success Card */}
      <InfoCard variant="success" icon={CheckCircle} className="mb-8">
        <h3 className="text-lg sm:text-xl font-semibold">
          Photo Approved
        </h3>
        <p className="mt-1 text-sm opacity-90">
          Ready for passport application
        </p>
      </InfoCard>

      {/* Processed Image */}
      {result.imageUrl && (
        <div className="mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex justify-center">
              <img
                src={result.imageUrl}
                alt="Validated passport photo"
                className="max-w-full max-h-96 rounded-lg shadow-sm border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        <StepActions>
          <form 
            action={`/api/stripe/create-checkout-session?orderId=${result?.orderId || ''}`} 
            method="POST" 
            className="flex-1"
          >
            <Button 
              type="submit"
              size="lg"
              className="w-full"
              disabled={!result?.orderId}
            >
              <CreditCard className="w-4 h-4" />
              Checkout - €9.99
            </Button>
          </form>

          <Button
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-none"
            onClick={() => handleDownload(result.imageUrl)}
            disabled={!result.imageUrl}
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </StepActions>

        <div className="pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-900"
            onClick={onUploadNew}
          >
            <Upload className="w-4 h-4" />
            Upload New Photo
          </Button>
        </div>
      </div>
    </div>
  );
}
