import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/file-utils";
import { useFilePreview, PASSPORT_PHOTO_ASPECT } from "@/hooks/use-file-preview";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  const preview = useFilePreview(file);

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
        <div className={`w-full ${PASSPORT_PHOTO_ASPECT}`}>
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full animate-pulse bg-muted" />
          )}
        </div>
      </div>

      {/* File Info */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive ml-4 flex-shrink-0"
          aria-label="Remove file"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
