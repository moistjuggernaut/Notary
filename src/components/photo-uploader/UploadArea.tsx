import { FileImage, Camera } from "lucide-react";
import { useState } from "react";

interface UploadAreaProps {
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onBrowseClick: () => void;
  onCameraClick: () => void;
}

export default function UploadArea({
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowseClick,
  onCameraClick
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragOver(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragLeave(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragging(false);
    onDrop(e);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Take Photo Box */}
      <div
        className="border-2 border-dashed border-blue-400 rounded-lg p-8 sm:p-10 text-center transition-all duration-200 hover:border-blue-600 hover:bg-blue-50 cursor-pointer"
        onClick={onCameraClick}
        role="button"
        tabIndex={0}
        aria-label="Take photo with camera"
      >
        <Camera className="w-14 h-14 sm:w-16 sm:h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Take Photo
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          Use your camera to capture a new photo
        </p>
        <p className="text-xs text-gray-500">
          High resolution recommended
        </p>
      </div>

      {/* Browse Files Box */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 sm:p-10 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-blue-600 bg-blue-100"
            : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onBrowseClick}
        role="button"
        tabIndex={0}
        aria-label="Browse files or drag and drop"
      >
        <FileImage className="w-14 h-14 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Browse Files
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {isDragging ? "Drop your photo here" : "Click to select or drag & drop"}
        </p>
        <p className="text-xs text-gray-500">
          JPG, PNG, WEBP up to 10MB
        </p>
      </div>
    </div>
  );
}
