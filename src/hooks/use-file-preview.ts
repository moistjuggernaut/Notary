import { useState, useEffect } from "react"

/**
 * Passport photo aspect ratio class (7:9 per ICAO standards).
 */
export const PASSPORT_PHOTO_ASPECT = "aspect-[7/9]"

/**
 * Converts a File to a data URL preview string.
 * If an imageUrl is provided, it takes precedence over the file.
 */
export function useFilePreview(file?: File, imageUrl?: string) {
  const [preview, setPreview] = useState<string | null>(imageUrl ?? null)

  useEffect(() => {
    if (imageUrl) {
      setPreview(imageUrl)
      return
    }

    if (!file) {
      setPreview(null)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [file, imageUrl])

  return preview
}
