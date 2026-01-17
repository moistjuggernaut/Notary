import { useState, useRef, useEffect } from "react";
import UploadArea from "../UploadArea";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";
import { validateImageFile } from "@/lib/file-utils";
import { useToast } from "@/hooks/use-toast";

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
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      setShowCamera(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      // Wait for next tick to ensure video element is in DOM
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      }, 0);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setShowCamera(false);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            const validation = validateImageFile(file);
            if (validation.isValid) {
              onFileSelect(file);
              stopCamera();
            } else {
              toast({
                title: "Invalid Image",
                description: validation.error || "Please try again.",
                variant: "destructive",
              });
            }
          }
        }, "image/jpeg", 0.95);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Your Photo</h3>
      </div>

      {!showCamera ? (
        <>
          <UploadArea
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onBrowseClick={openFileDialog}
            onCameraClick={startCamera}
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
        </>
      ) : (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <Button
            onClick={stopCamera}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
            aria-label="Close camera"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto min-h-[400px] max-h-[60vh] object-contain"
          />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent flex justify-center">
            <Button
              onClick={capturePhoto}
              size="lg"
            >
              <Camera />
              Capture Photo
            </Button>
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
