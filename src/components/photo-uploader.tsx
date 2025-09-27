import { useRef } from "react";
import { Upload, X, CloudUpload, FileImage, AlertTriangle, Camera, CheckCircle, XCircle, Download } from "lucide-react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize, validateImageFile } from "@/lib/file-utils";
import type { ValidationResult } from "@/types/validation";

interface PhotoUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  onValidatePhoto: () => void;
  isValidating: boolean;
  isValidationAllowed: boolean;
  quickCheckError: string | null;
  validationResult?: ValidationResult | null;
}

const getErrorMessage = (error: string): { title: string; description: string; suggestions: string[] } => {
  if (error.toLowerCase().includes('no face') || error.toLowerCase().includes('0 faces')) {
    return {
      title: 'No Face Detected',
      description: 'The system could not detect a face in your photo.',
      suggestions: [
        'Ensure the face is clearly visible and well-lit',
        'Make sure the face is not obscured by shadows or objects',
        'Try a photo with better lighting conditions'
      ]
    };
  }
  
  if (error.toLowerCase().includes('multiple faces') || error.toLowerCase().includes('more than 1 face')) {
    return {
      title: 'Multiple Faces Detected',
      description: 'Only one face should be visible in passport photos.',
      suggestions: [
        'Take a photo with only the child visible',
        'Remove other people from the background',
        'Crop the photo to show only the child\'s face'
      ]
    };
  }
  
  if (error.toLowerCase().includes('file size') || error.toLowerCase().includes('too large')) {
    return {
      title: 'File Too Large',
      description: 'The photo file size exceeds the 10MB limit.',
      suggestions: [
        'Compress the image using photo editing software',
        'Take a new photo with lower resolution',
        'Use a different image format (JPEG typically has smaller file sizes)'
      ]
    };
  }
  
  if (error.toLowerCase().includes('format') || error.toLowerCase().includes('type')) {
    return {
      title: 'Unsupported File Format',
      description: 'Please use a supported image format.',
      suggestions: [
        'Convert to JPEG, PNG, or WEBP format',
        'Use a photo editing app to save in the correct format',
        'Take a new photo with your device\'s camera'
      ]
    };
  }
  
  // Generic error fallback
  return {
    title: 'Upload Error',
    description: error || 'An error occurred while processing your photo.',
    suggestions: [
      'Try uploading a different photo',
      'Check that the photo meets the requirements below',
      'Ensure you have a stable internet connection'
    ]
  };
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pass':
      return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case 'fail':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <CheckCircle className="w-5 h-5 text-emerald-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pass':
      return 'bg-emerald-50 border-emerald-200';
    case 'warning':
      return 'bg-amber-50 border-amber-200';
    case 'fail':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-emerald-50 border-emerald-200';
  }
};

const getOverallStatus = (result: ValidationResult) => {
  switch (result.status) {
    case 'success':
      return {
        icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
        title: 'Photo Approved ✓',
        description: 'Ready for passport application',
        bgColor: 'bg-emerald-50 border-l-4 border-emerald-500',
        textColor: 'text-emerald-800'
      };
    case 'warning':
      return {
        icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
        title: 'Minor Issues Detected',
        description: 'May be acceptable - see recommendations',
        bgColor: 'bg-amber-50 border-l-4 border-amber-500',
        textColor: 'text-amber-800'
      };
    case 'error':
      return {
        icon: <XCircle className="w-8 h-8 text-red-500" />,
        title: 'Photo Rejected',
        description: 'Does not meet requirements',
        bgColor: 'bg-red-50 border-l-4 border-red-500',
        textColor: 'text-red-800'
      };
    default:
      return {
        icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
        title: 'Validation Complete',
        description: 'Review results below',
        bgColor: 'bg-gray-50 border-l-4 border-gray-400',
        textColor: 'text-gray-800'
      };
  }
};

export default function PhotoUploader({ 
  selectedFile, 
  onFileSelect, 
  onRemoveFile, 
  onValidatePhoto,
  isValidating,
  isValidationAllowed,
  quickCheckError,
  validationResult,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validation = validateImageFile(files[0]);
      if (!validation.isValid) {
        return;
      }
      onFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const validation = validateImageFile(files[0]);
      if (!validation.isValid) {
        return;
      }
      onFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const errorInfo = quickCheckError ? getErrorMessage(quickCheckError) : null;

  // Group checks by category for validation results
  const groupedChecks = validationResult ? validationResult.checks.reduce((acc, check) => {
    if (!acc[check.category]) {
      acc[check.category] = [];
    }
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, typeof validationResult.checks>) : {};

  const categoryTitles = {
    photo_quality: 'Photo Quality',
    face_position: 'Face Position',
    framing: 'Framing',
    technical: 'Technical'
  };

  const handleDownload = async () => {
    if (!validationResult?.validatedImageUrl) return;
  
    try {
      // Fetch the image data from the cross-origin URL
      const response = await fetch(validationResult.validatedImageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
  
      // Create a local URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
  
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'validated_passport_photo.jpg';
      a.style.display = 'none';
  
      // Append to DOM, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  
      // Revoke the temporary URL after the download is initiated
      window.URL.revokeObjectURL(blobUrl);
  
    } catch (error) {
      console.error("Download failed:", error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
            {validationResult ? 'Validation Results' : 'Upload Your Photo'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {validationResult 
              ? validationResult.summary
              : 'Select a high-quality photo for passport validation.'
            }
          </p>
        </div>
        
        {/* Validation Results - Show prominently if available */}
        {validationResult && (
          <div className="px-4 sm:px-6 lg:px-8 pb-6">
            {/* Overall Status */}
            <div className={`mb-6 p-4 sm:p-6 rounded-lg ${getOverallStatus(validationResult).bgColor}`}>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getOverallStatus(validationResult).icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg sm:text-xl font-semibold ${getOverallStatus(validationResult).textColor}`}>
                    {getOverallStatus(validationResult).title}
                  </h3>
                  <p className={`mt-1 text-sm ${getOverallStatus(validationResult).textColor} opacity-90`}>
                    {getOverallStatus(validationResult).description}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Checks */}
            <div className="space-y-4 mb-6">
              {Object.entries(groupedChecks).map(([category, checks]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                    {categoryTitles[category as keyof typeof categoryTitles]}
                  </h4>
                  {checks.map((check, index) => (
                    <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg border ${getStatusColor(check.status)}`}>
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(check.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{check.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{check.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Processed Image */}
            {validationResult.validatedImageUrl && (
              <div className="mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Validated Image
                  </h4>
                  <div className="flex justify-center">
                    <img 
                      src={validationResult.validatedImageUrl}
                      alt="Validated passport photo"
                      className="max-w-full max-h-64 rounded-lg shadow-sm border border-gray-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons for Results */}
            <div className="flex flex-col sm:flex-row gap-3 pb-6 border-b border-gray-200">
              <Button 
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white h-11"
                onClick={handleDownload}
                disabled={!validationResult?.validatedImageUrl}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <form action={`/api/stripe/create-checkout-session?orderId=${validationResult?.orderId || ''}`} method="POST" className="flex-1 sm:flex-none">
                <Button 
                  variant="outline" 
                  type="submit"
                  className="w-full h-11"
                  disabled={!validationResult?.orderId}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Checkout
                </Button>
              </form>
            </div>
          </div>
        )}
        
        {/* Upload Area - Hide when results are shown */}
        {!validationResult && (
          <div className="px-4 sm:px-6 lg:px-8 pb-6">
            {!selectedFile && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
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
            )}

            {selectedFile && (
              <div className="space-y-4">
                {/* Selected File Display */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FileImage className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0 ml-4">
                    <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemoveFile}
                    className="text-gray-400 hover:text-red-500 ml-4 flex-shrink-0"
                    aria-label="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Error Display */}
                {errorInfo && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium text-red-800 mb-1">
                          {errorInfo.title}
                        </h4>
                        <p className="text-sm text-red-700 mb-3">
                          {errorInfo.description}
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-red-800">Suggestions:</p>
                          <ul className="text-sm text-red-700 space-y-1">
                            {errorInfo.suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-red-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={onValidatePhoto}
                    disabled={!isValidationAllowed || isValidating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isValidating ? (
                      <>
                        <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Run EU Validation
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={onRemoveFile}
                    className="sm:w-auto h-11"
                    disabled={isValidating}
                  >
                    Use Different Photo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          aria-label="Select photo file"
        />
      </div>
    </div>
  );
}