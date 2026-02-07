import { useEffect, useState } from "react";
import { CheckCircle, Download, CreditCard, Upload, Wand2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChecklistItem } from "@/components/ui/checklist-item";
import PhotoWithSidebar from "../photo-with-sidebar";
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
    <div className="px-4 sm:px-6 lg:px-8 py-12 min-h-[480px] sm:min-h-[520px] lg:min-h-[560px]">
      <div className="mb-8">
        <PhotoWithSidebar
          imageUrl={displayImageUrl}
          imageAlt="Validated passport photo"
          highlight="approved"
          sidebar={
            <div className="flex flex-col h-full">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                Final Checks
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Please confirm these details before proceeding.
              </p>
              <ul className="space-y-2.5">
                {FINAL_CHECKS.map((label) => (
                  <li key={label}>
                    <ChecklistItem icon={CheckCircle} variant="default" size="sm">
                      {label}
                    </ChecklistItem>
                  </li>
                ))}
              </ul>
            </div>
          }
        />
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
