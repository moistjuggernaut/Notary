import { AlertTriangle } from "lucide-react";

interface ErrorDisplayProps {
  error: string;
}

const getErrorMessage = (error: string) => {
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

export default function ErrorDisplay({ error }: ErrorDisplayProps) {
  const errorInfo = getErrorMessage(error);

  return (
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
  );
}
