import { useEffect, useState } from "react";
import { CheckCircle, Download, CreditCard, Upload, Wand2, RotateCcw, Square, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoCard } from "@/components/ui/info-card";
import { handleDownload } from "../utils";
import type { ValidationResult } from "@/types/validation";
import { removeBackground } from "@/api/client";

const FINAL_CHECKS = [
  "The photo looks like you",
  "Background appears plain and uniform",
  "Both eyes are clearly visible",
  "Expression is neutral",
] as const;

interface SuccessStepProps {
  result: ValidationResult;
  onUploadNew: () => void;
}

export default function SuccessStep({ result, onUploadNew }: SuccessStepProps) {
  const [displayImageUrl, setDisplayImageUrl] = useState<string | undefined>(result.imageUrl);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false);
  const [cachedBgRemovedUrl, setCachedBgRemovedUrl] = useState<string | undefined>(undefined);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    setDisplayImageUrl(result.imageUrl);
    setIsBackgroundRemoved(false);
    setCachedBgRemovedUrl(undefined);
  }, [result.imageUrl]);

  const handleRemoveBackground = async () => {
    if (!result.orderId) return;

    // Use cached version if available
    if (cachedBgRemovedUrl) {
      setDisplayImageUrl(cachedBgRemovedUrl);
      setIsBackgroundRemoved(true);
      return;
    }

    setIsRemovingBackground(true);
    try {
      const response = await removeBackground(result.orderId);
      if (!response.success || !response.imageUrl) {
        throw new Error(response.error || 'Background removal failed');
      }
      setDisplayImageUrl(response.imageUrl);
      setCachedBgRemovedUrl(response.imageUrl);
      setIsBackgroundRemoved(true);
    } catch (error) {
      console.error('Background removal failed:', error);
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleResetBackground = () => {
    setDisplayImageUrl(result.imageUrl);
    setIsBackgroundRemoved(false);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12">
      <InfoCard variant="success" icon={CheckCircle} className="mb-8">
        <h3 className="text-lg sm:text-xl font-semibold">
          Photo Approved
        </h3>
        <p className="mt-1 text-sm opacity-90">
          Ready for passport application
        </p>
      </InfoCard>

      {displayImageUrl && (
        <div className="mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex justify-center">
              <img
                src={displayImageUrl}
                alt="Validated passport photo"
                className="max-w-full max-h-96 rounded-lg shadow-sm border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Final manual checks */}
      <div className="mb-8 rounded-lg border border-blue-100 bg-blue-50/50 p-5">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
          Final Checks
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Please confirm these details before proceeding.
        </p>
        <ul className="space-y-2">
          {FINAL_CHECKS.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                className="flex items-start gap-2 w-full text-left group"
                onClick={() => toggleCheck(index)}
              >
                {checkedItems[index] ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
                )}
                <span
                  className={`text-sm ${
                    checkedItems[index] ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-3">
            <form
              action={`/api/stripe/create-checkout-session?orderId=${result?.orderId || ''}`}
              method="POST"
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
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleRemoveBackground}
              disabled={!result?.orderId || !result.imageUrl || isRemovingBackground || isBackgroundRemoved}
            >
              <Wand2 className="w-4 h-4" />
              {isRemovingBackground ? 'Removing…' : 'Remove background'}
            </Button>
          </div>

          <div className="flex-1 sm:flex-none space-y-3 sm:min-w-[200px]">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => handleDownload(displayImageUrl)}
              disabled={!displayImageUrl}
            >
              <Download className="w-4 h-4" />
              Download
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleResetBackground}
              disabled={!isBackgroundRemoved}
              style={{ visibility: isBackgroundRemoved ? 'visible' : 'hidden' }}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>

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
