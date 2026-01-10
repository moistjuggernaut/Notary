import UploadArea from "../UploadArea";

interface UploadStepProps {
  onFileSelect: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  openFileDialog: () => void;
}

export default function UploadStep({
  onFileSelect,
  fileInputRef,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  openFileDialog,
}: UploadStepProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Your Photo</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Select a high-quality photo for passport validation.
        </p>
      </div>

      <UploadArea
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            onFileSelect(files[0]);
          }
        }}
        aria-label="Select photo file"
      />
    </div>
  );
}
