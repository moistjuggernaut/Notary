// Utility functions for photo uploader components

export const handleDownload = async (imageUrl?: string) => {
  if (!imageUrl) return;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'validated_passport_photo.jpg';
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed:", error);
  }
};

export const getErrorMessage = (error: string) => ({
  title: 'Upload Error',
  description: error,
  suggestions: ['Try uploading a different photo']
});

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pass': return '✅';
    case 'fail': return '❌';
    default: return '✅';
  }
};

export const getOverallStatus = (result: any) => ({
  icon: result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️',
  title: result.status === 'success' ? 'Photo Approved ✓' :
         result.status === 'error' ? 'Photo Rejected' : 'Minor Issues Detected',
  description: result.status === 'success' ? 'Ready for passport application' :
               result.status === 'error' ? 'Does not meet requirements' : 'May be acceptable',
  bgColor: result.status === 'success' ? 'bg-emerald-50 border-l-4 border-emerald-500' :
           result.status === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
           'bg-amber-50 border-l-4 border-amber-500',
  textColor: result.status === 'success' ? 'text-emerald-800' :
             result.status === 'error' ? 'text-red-800' : 'text-amber-800'
});
