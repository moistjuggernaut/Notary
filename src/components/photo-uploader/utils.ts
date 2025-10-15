import { CheckCircle, XCircle, AlertTriangle, type LucideIcon } from "lucide-react";

interface StatusConfig {
  Icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
  bgColor: string;
  textColor: string;
}

export const getStatusConfig = (status: 'success' | 'warning' | 'error'): StatusConfig => {
  const configs: Record<'success' | 'warning' | 'error', StatusConfig> = {
    success: {
      Icon: CheckCircle,
      iconColor: 'text-emerald-600',
      title: 'Photo Approved ✓',
      description: 'Please perform a final visual check to confirm the overall appearance and quality.',
      bgColor: 'bg-emerald-50 border-l-4 border-emerald-500',
      textColor: 'text-emerald-800'
    },
    error: {
      Icon: XCircle,
      iconColor: 'text-red-500',
      title: 'Photo Rejected',
      description: 'Does not meet requirements',
      bgColor: 'bg-red-50 border-l-4 border-red-500',
      textColor: 'text-red-800'
    },
    warning: {
      Icon: AlertTriangle,
      iconColor: 'text-amber-500',
      title: 'Minor Issues Detected',
      description: 'May be acceptable',
      bgColor: 'bg-amber-50 border-l-4 border-amber-500',
      textColor: 'text-amber-800'
    }
  };

  return configs[status];
};

export const handleDownload = async (imageUrl?: string) => {
  if (!imageUrl) return;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'validated_passport_photo.jpg';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
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
