import { useEffect } from "react";

const DEFAULT_TITLE = "Passport Photo Validator — Check Your Photo Meets ICAO & EU Standards Online";
const DEFAULT_DESCRIPTION = "Free online passport photo validator. Upload your photo and instantly check it meets ICAO international standards and EU biometric requirements.";

export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description || DEFAULT_DESCRIPTION);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      if (meta) meta.setAttribute("content", DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
