import UploadArea from "../upload-area";
import { STEP_CONTAINER_CLASS } from "./cta-classes";

interface UploadStepProps {
  documentLabel: string;
  onFileSelect: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  openFileDialog: () => void;
}

export default function UploadStep({
  documentLabel,
  onFileSelect,
  fileInputRef,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  openFileDialog,
}: UploadStepProps) {
  return (
    <div className={STEP_CONTAINER_CLASS}>
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-3">Upload Your Photo</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Select a clear photo for your {documentLabel} renewal. We will check the requirements,
          crop it to the right size, and offer background removal if needed.
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
