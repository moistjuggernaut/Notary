import { useState, useRef } from "react";
import { Upload, X, CloudUpload, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize, validateImageFile } from "@/lib/file-utils";

interface PhotoUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  onValidatePhoto: () => void;
  isValidating: boolean;
}

export default function PhotoUploader({ 
  selectedFile, 
  onFileSelect, 
  onRemoveFile, 
  onValidatePhoto,
  isValidating 
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          onFileSelect(file);
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 200);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="mb-12">
      <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-dark-slate mb-2">Upload Your Child's Photo</h3>
          <p className="text-slate-grey">Drag and drop your photo or click to browse. We'll validate it against ICAO standards.</p>
        </div>

        {!selectedFile && !isUploading && (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-official-blue bg-blue-50' 
                : 'border-gray-300 hover:border-official-blue hover:bg-gray-50'
            }`}
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

        {isUploading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-dark-slate">Uploading...</span>
              <span className="text-sm text-slate-grey">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {selectedFile && !isUploading && (
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

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={onValidatePhoto}
                disabled={isValidating}
                className="flex-1 bg-official-blue hover:bg-blue-700 text-white"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Validate Photo
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onRemoveFile}
                className="sm:w-auto"
              >
                Upload Different Photo
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
        />
      </div>
    </section>
  );
}
