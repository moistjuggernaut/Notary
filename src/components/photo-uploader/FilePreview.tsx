import { X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/file-utils";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  return (
    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0">
        <FileImage className="w-8 h-8 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0 ml-4">
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
  );
}
