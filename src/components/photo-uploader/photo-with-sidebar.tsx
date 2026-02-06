import { useState, useEffect } from "react";

interface PhotoWithSidebarProps {
  file: File;
  overlay?: React.ReactNode;
  sidebar: React.ReactNode;
}

export default function PhotoWithSidebar({
  file,
  overlay,
  sidebar,
}: PhotoWithSidebarProps) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left column: Image */}
      <div className="flex-1 min-w-0">
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
          {preview ? (
            <img
              src={preview}
              alt="Photo preview"
              className="w-full h-auto max-h-96 object-contain"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 w-full h-full" />
            </div>
          )}

          {/* Optional overlay (e.g. spinner during validation) */}
          {overlay && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
              {overlay}
            </div>
          )}
        </div>
      </div>

      {/* Right column: Contextual sidebar */}
      <div className="flex-1 min-w-0">{sidebar}</div>
    </div>
  );
}
