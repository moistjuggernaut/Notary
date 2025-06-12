import { useRef } from "react";
import { Upload, X, CloudUpload, FileImage, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize, validateImageFile } from "@/lib/file-utils";

interface PhotoUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  onValidatePhoto: () => void;
  isValidating: boolean; // This now represents both quick checking and full validation
  isValidationAllowed: boolean;
  quickCheckError: string | null;
}

export default function PhotoUploader({ 
  selectedFile, 
  onFileSelect, 
  onRemoveFile, 
  onValidatePhoto,
  isValidating,
  isValidationAllowed,
  quickCheckError
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validation = validateImageFile(files[0]);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }
      onFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDragLeave = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const validation = validateImageFile(files[0]);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }
      onFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="mb-16">
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-semibold text-dark-slate mb-4">Upload Your Baby's Photo</h3>
          <p className="text-slate-grey text-lg leading-relaxed max-w-2xl mx-auto">Drag and drop your photo or click to browse. We'll run a quick check for a single face before the full validation.</p>
        </div>
        
        {!selectedFile && (
          <div
            className='border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 border-gray-300 hover:border-official-blue hover:bg-gray-50'
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <CloudUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-dark-slate mb-2">Drop your photo here</h4>
            <p className="text-slate-grey mb-4">or <span className="text-official-blue font-medium">click to browse</span></p>
            <p className="text-sm text-slate-grey">Supports JPG, PNG, WEBP files up to 10MB</p>
          </div>
        )}

        {selectedFile && (
          <div className="space-y-6">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <FileImage className="text-official-blue text-2xl mr-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-dark-slate truncate">{selectedFile.name}</p>
                <p className="text-sm text-slate-grey">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemoveFile}
                className="text-gray-400 hover:text-red-500 ml-4"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {quickCheckError && (
              <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-lg">
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium">{quickCheckError}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={onValidatePhoto}
                disabled={!isValidationAllowed || isValidating}
                className="flex-1 bg-official-blue hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Run Full ICAO Validation
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onRemoveFile}
                className="sm:w-auto"
              >
                Use a Different Photo
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
        />
      </div>
    </section>
  );
}