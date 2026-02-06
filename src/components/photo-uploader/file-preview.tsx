import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/file-utils";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      {preview && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto max-h-96 object-contain"
          />
        </div>
      )}

      {/* File Info */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 ml-4 flex-shrink-0"
          aria-label="Remove file"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
