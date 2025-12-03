export const requirementsSections = [
  {
    id: "photo-quality",
    title: "Photo Quality",
    items: [
      "Color photo with neutral lighting (no shadows, no overexposure)",
      "High resolution, sharp focus meeting biometric standards",
      "Plain white or light gray background (no patterns or textures)",
      "No red-eye or reflections",
    ],
  },
  {
    id: "face-position",
    title: "Face Position & Expression",
    items: [
      "Centered face, looking straight at the camera",
      "Both eyes open and clearly visible",
      "Neutral facial expression (mouth closed, no smiling)",
      "Head not tilted, no support from hands or objects",
    ],
  },
  {
    id: "framing",
    title: "Framing",
    items: [
      "Full face visible (top of head to chin), no parts cropped",
      "Both edges of the face should be visible",
      "No hats or head coverings (except religious/medical reasons)",
      "Glasses allowed if clear, thin-framed, no glare, eyes fully visible",
    ],
  },
] as const;

export const childrenRequirements = {
  title: "Children Under 10 (Relaxed Standards)",
  description: "ICAO guidelines provide flexibility for photographing young children:",
  items: [
    "Slight smile or slightly open mouth often accepted",
    "Head position more flexible (doesn't need to be perfectly straight)",
    "Eyes visible but don't need perfect horizontal alignment",
    "No toys, pacifiers, or other objects in the frame",
  ],
} as const;

export const infantRequirements = {
  title: "Babies & Infants Under 1 Year (Maximum Flexibility)",
  description: "EU guidelines following ICAO standards provide special allowances for very young infants:",
  items: [
    "Eyes do not need to be open",
    "Non-neutral expression tolerated (crying discouraged but not disqualifying)",
    "Can be photographed lying on white blanket or in car seat with white cloth",
    "No other people or objects (toys, pacifiers) in the photo",
  ],
} as const;

export const regulationLinks = {
  eu2252: {
    url: "https://eur-lex.europa.eu/eli/reg/2004/2252/oj",
    label: "EU Regulation 2252/2004",
  },
  eu444: {
    url: "https://eur-lex.europa.eu/eli/reg/2009/444/oj",
    label: "EU Regulation 444/2009",
  },
  icao9303: {
    url: "https://www.icao.int/publications/pages/publication.aspx?docnum=9303",
    label: "ICAO Document 9303",
  },
} as const;

