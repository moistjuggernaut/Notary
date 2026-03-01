export type DocType = 'passport' | 'drivers_license'

export type CountryConfig = {
  code: string // ISO 3166-1 alpha-2
  name: string
  flag: string // emoji flag
  passport: { widthMm: number; heightMm: number }
  driversLicense: { widthMm: number; heightMm: number }
  requiresChoice: boolean // true when passport ≠ DL dims
}

export const EU_COUNTRIES: CountryConfig[] = [
  {
    code: 'AT',
    name: 'Austria',
    flag: '🇦🇹',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'BE',
    name: 'Belgium',
    flag: '🇧🇪',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'BG',
    name: 'Bulgaria',
    flag: '🇧🇬',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'HR',
    name: 'Croatia',
    flag: '🇭🇷',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 30, heightMm: 35 },
    requiresChoice: true,
  },
  {
    code: 'CY',
    name: 'Cyprus',
    flag: '🇨🇾',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'CZ',
    name: 'Czech Republic',
    flag: '🇨🇿',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'DK',
    name: 'Denmark',
    flag: '🇩🇰',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'EE',
    name: 'Estonia',
    flag: '🇪🇪',
    passport: { widthMm: 40, heightMm: 50 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: true,
  },
  {
    code: 'FI',
    name: 'Finland',
    flag: '🇫🇮',
    passport: { widthMm: 36, heightMm: 47 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: true,
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'GR',
    name: 'Greece',
    flag: '🇬🇷',
    passport: { widthMm: 40, heightMm: 60 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: true,
  },
  {
    code: 'HU',
    name: 'Hungary',
    flag: '🇭🇺',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'LV',
    name: 'Latvia',
    flag: '🇱🇻',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'LT',
    name: 'Lithuania',
    flag: '🇱🇹',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'LU',
    name: 'Luxembourg',
    flag: '🇱🇺',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'MT',
    name: 'Malta',
    flag: '🇲🇹',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'PL',
    name: 'Poland',
    flag: '🇵🇱',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'RO',
    name: 'Romania',
    flag: '🇷🇴',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'SK',
    name: 'Slovakia',
    flag: '🇸🇰',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'SI',
    name: 'Slovenia',
    flag: '🇸🇮',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 32, heightMm: 26 },
    requiresChoice: true,
  },
  {
    code: 'SE',
    name: 'Sweden',
    flag: '🇸🇪',
    passport: { widthMm: 35, heightMm: 45 },
    driversLicense: { widthMm: 35, heightMm: 45 },
    requiresChoice: false,
  },
]

export function getCountryByCode(code: string): CountryConfig | undefined {
  return EU_COUNTRIES.find((c) => c.code === code)
}

export function getDimensions(
  country: CountryConfig,
  docType: DocType
): { widthMm: number; heightMm: number } {
  return docType === 'passport' ? country.passport : country.driversLicense
}
