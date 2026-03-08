import { useEffect, useState } from "react";
import { CheckCircle, Download, CreditCard, Upload, Wand2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChecklistItem } from "@/components/ui/checklist-item";
import PhotoWithSidebar from "../photo-with-sidebar";
import { handleDownload } from "../utils";
import {
  STEP_CONTAINER_CLASS,
  CTA_PRIMARY_BUTTON_CLASS,
  CTA_PRIMARY_COLUMN_CLASS,
  CTA_ROW_CLASS,
  CTA_SECONDARY_BUTTON_CLASS,
  CTA_SECONDARY_COLUMN_CLASS,
} from "./cta-classes";
import type { ValidationResult } from "@/types/validation";
import { removeBackground } from "@/api/client";

const FINAL_CHECKS = [
  "The photo looks like you",
  "Background appears plain and uniform",
  "Both eyes are clearly visible",
  "Expression is neutral",
] as const;

interface SuccessStepProps {
  documentLabel: string;
  result: ValidationResult;
  onUploadNew: () => void;
}

export default function SuccessStep({ documentLabel, result, onUploadNew }: SuccessStepProps) {
  const [displayImageUrl, setDisplayImageUrl] = useState<string | undefined>(result.imageUrl);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false);
  const [cachedBgRemovedUrl, setCachedBgRemovedUrl] = useState<string | undefined>(undefined);
  const [cachedBgRemovedSheetUrl, setCachedBgRemovedSheetUrl] = useState<string | undefined>(undefined);

  // Store the original sheet URL so we can switch back to it on reset
  const [originalSheetUrl, setOriginalSheetUrl] = useState<string | undefined>(result.sheetUrl);

  useEffect(() => {
    setDisplayImageUrl(result.imageUrl);
    setOriginalSheetUrl(result.sheetUrl);
    setIsBackgroundRemoved(false);
    setCachedBgRemovedUrl(undefined);
    setCachedBgRemovedSheetUrl(undefined);
  }, [result.imageUrl, result.sheetUrl]);

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

      if (response.sheetUrl) {
        setCachedBgRemovedSheetUrl(response.sheetUrl);
      }

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
    <div className={STEP_CONTAINER_CLASS}>
      <div className="mb-8">
        <PhotoWithSidebar
          imageUrl={displayImageUrl}
          imageAlt={`Validated ${documentLabel} photo`}
          highlight="approved"
          sidebar={
            <div className="flex flex-col h-full">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                Final Checks
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
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
        <div className={CTA_ROW_CLASS}>
          <div className={CTA_PRIMARY_COLUMN_CLASS}>
            <form
              className="w-full contents"
              action={`/api/stripe/create-checkout-session?orderId=${result?.orderId || ''}&bgRemoved=${isBackgroundRemoved}`}
              method="POST"
            >
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className={CTA_PRIMARY_BUTTON_CLASS}
                disabled={!result?.orderId}
              >
                <CreditCard className="w-4 h-4" />
                Order Printed Photos - €9.99
              </Button>
            </form>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className={CTA_PRIMARY_BUTTON_CLASS}
              onClick={handleRemoveBackground}
              disabled={!result?.orderId || !result.imageUrl || isRemovingBackground || isBackgroundRemoved}
            >
              <Wand2 className="w-4 h-4" />
              {isRemovingBackground ? 'Removing…' : 'Remove background'}
            </Button>
          </div>

          <div className={CTA_SECONDARY_COLUMN_CLASS}>
            <Button
              variant="outline"
              size="lg"
              className={CTA_SECONDARY_BUTTON_CLASS}
              onClick={() => {
                const downloadUrl = isBackgroundRemoved
                  ? (cachedBgRemovedSheetUrl || cachedBgRemovedUrl || displayImageUrl)
                  : (originalSheetUrl || displayImageUrl);
                handleDownload(downloadUrl);
              }}
              disabled={!displayImageUrl}
            >
              <Download className="w-4 h-4" />
              Free Digital Download
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className={`${CTA_SECONDARY_BUTTON_CLASS} ${isBackgroundRemoved ? 'visible' : 'invisible'}`}
              onClick={handleResetBackground}
              disabled={!isBackgroundRemoved}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-muted-foreground hover:text-foreground"
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
