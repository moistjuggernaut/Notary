import { useFilePreview, PASSPORT_PHOTO_ASPECT } from "@/hooks/use-file-preview";

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
  const preview = useFilePreview(file, imageUrl);
  const isApproved = highlight === "approved";

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left column: Image */}
      <div className="flex-1 min-w-0">
        <div
          className={`relative rounded-lg overflow-hidden bg-muted ${
            isApproved
              ? "border-[3px] border-success/60 ring-2 ring-success/30 shadow-sm shadow-success/20"
              : "border border-border"
          }`}
        >
          <div className={`w-full ${PASSPORT_PHOTO_ASPECT}`}>
            {preview ? (
              <img
                src={preview}
                alt={imageAlt}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full animate-pulse bg-muted" />
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
