import { CloudUpload, FileImage, Camera } from "lucide-react";

interface UploadAreaProps {
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}

export default function UploadArea({
  onDragOver,
  onDragLeave,
  onDrop,
  onClick
}: UploadAreaProps) {
  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Upload photo"
    >
      <CloudUpload className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
        Drop your photo here
      </h3>
      <p className="text-gray-600 mb-4">
        or <span className="text-blue-600 font-medium">click to browse</span>
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500">
        <div className="flex items-center">
          <FileImage className="w-4 h-4 mr-1" />
          JPG, PNG, WEBP up to 10MB
        </div>
        <div className="hidden sm:block">•</div>
        <div className="flex items-center">
          <Camera className="w-4 h-4 mr-1" />
          High resolution recommended
        </div>
      </div>
    </div>
  );
}
