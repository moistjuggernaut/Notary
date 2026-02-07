import { useState, useEffect } from "react";

interface PhotoWithSidebarProps {
  file?: File;
  imageUrl?: string;
  imageAlt?: string;
  overlay?: React.ReactNode;
  highlight?: "approved";
  sidebar: React.ReactNode;
}

export default function PhotoWithSidebar({
  file,
  imageUrl,
  imageAlt = "Photo preview",
  overlay,
  highlight,
  sidebar,
}: PhotoWithSidebarProps) {
  const [preview, setPreview] = useState<string | null>(imageUrl ?? null);
  const isApproved = highlight === "approved";

  useEffect(() => {
    if (imageUrl) {
      setPreview(imageUrl);
      return;
    }

    if (!file) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [file, imageUrl]);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left column: Image */}
      <div className="flex-1 min-w-0">
        <div
          className={`relative rounded-lg overflow-hidden bg-gray-100 ${
            isApproved
              ? "border-[3px] border-emerald-500/60 ring-2 ring-emerald-300/40 shadow-sm shadow-emerald-200/50"
              : "border border-gray-200"
          }`}
        >
          <div className="w-full aspect-[7/9]">
            {preview ? (
              <img
                src={preview}
                alt={imageAlt}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full animate-pulse bg-gray-200" />
            )}
          </div>

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
