---
name: Country & Doc Type Selection
overview: Add a country/document type selection modal on the home screen "Start Validating" button. The selected country and document type (when dimensions differ) are passed to the validate page and used to configure the correct photo dimensions for both output and validation.
todos:
  - id: country-config
    content: Create src/lib/country-config.ts with all 27 EU country entries, dimensions, and requiresChoice flag
    status: in_progress
  - id: modal-component
    content: Create src/components/CountrySelectModal.tsx with country dropdown and conditional doc type radio
    status: pending
  - id: home-page
    content: Update home.tsx to open CountrySelectModal on 'Start Validating' click and navigate on confirm
    status: pending
  - id: api-types
    content: Add country and docType fields to ValidationRequest in src/types/api.ts
    status: pending
  - id: api-client
    content: Update validatePhoto() in src/api/client.ts to accept and pass country/docType
    status: pending
  - id: hook
    content: Update usePhotoValidation.ts to accept country/docType and pass to API
    status: pending
  - id: validate-page
    content: Update validate.tsx to read URL params country/docType and pass to hook
    status: pending
  - id: server-constants
    content: Add COUNTRY_DIMENSIONS map and DocumentType to server/validation-constants.ts
    status: pending
  - id: api-endpoint
    content: Update ValidationSchema and route handler in api/index.ts to accept country/docType and derive dimensions
    status: pending
  - id: photo-validator
    content: Update server/photo-validator.ts validatePhoto() to accept optional widthMm/heightMm params
    status: pending
isProject: false
---

# Country & Document Type Selection

## Architecture Overview

```mermaid
flowchart TD
    Home["Home Page"] -->|"Click 'Start Validating'"| Modal["CountrySelectModal"]
    Modal -->|"Select country"| DocChoice{"Dimensions differ?"}
    DocChoice -->|"Yes (5 countries)"| DocType["Show Passport / DL choice"]
    DocChoice -->|"No (22 countries)"| Continue["Continue"]
    DocType --> Continue
    Continue -->|"Navigate /validate?country=HR&docType=passport"| Validate["Validate Page"]
    Validate --> Hook["usePhotoValidation(country, docType)"]
    Hook -->|"POST with country+docType"| API["API /photo/validate"]
    API --> Dims["countryDimensions lookup"]
    Dims --> Validator["validatePhoto(buffer, widthMm, heightMm)"]
```



## Countries Requiring Doc Type Choice (dimensions differ)

- Croatia: Passport 35×45, DL 30×35
- Estonia: Passport 40×50, DL 35×45
- Finland: Passport 36×47, DL 35×45
- Greece: Passport 40×60, DL 35×45
- Spain: Passport 35×45, DL 32×26

All other 22 countries: both use 35×45 mm (no choice shown).

## Files to Create

- `[src/lib/country-config.ts](src/lib/country-config.ts)` — country data: name, passport dims, DL dims, requiresChoice flag
- `[src/components/CountrySelectModal.tsx](src/components/CountrySelectModal.tsx)` — Dialog with country dropdown + conditional doc type radio buttons

## Files to Modify

- `[src/pages/home.tsx](src/pages/home.tsx)` — Replace `Link href="/validate"` with state + modal trigger; navigate on confirm
- `[src/types/api.ts](src/types/api.ts)` — Add optional `country` and `docType` fields to `ValidationRequest`
- `[src/api/client.ts](src/api/client.ts)` — Accept and forward `country`/`docType` in `validatePhoto()`
- `[src/hooks/usePhotoValidation.ts](src/hooks/usePhotoValidation.ts)` — Accept `country` and `docType` props, pass to API call
- `[src/pages/validate.tsx](src/pages/validate.tsx)` — Read `?country=` and `?docType=` from URL; pass to hook
- `[server/validation-constants.ts](server/validation-constants.ts)` — Add `COUNTRY_DIMENSIONS` map (27 entries) and `DocumentType` constant
- `[api/index.ts](api/index.ts)` — Add optional `country` and `docType` to `ValidationSchema`; derive dimensions and pass to `validatePhoto`
- `[server/photo-validator.ts](server/photo-validator.ts)` — Accept optional `widthMm`/`heightMm` params; fall back to `ICAOConfig` defaults

## Key Implementation Details

`**src/lib/country-config.ts**` — typed data structure:

```typescript
export type DocType = 'passport' | 'drivers_license';
export interface CountryConfig {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  passport: { widthMm: number; heightMm: number };
  driversLicense: { widthMm: number; heightMm: number };
  requiresChoice: boolean; // true when passport ≠ DL dims
}
```

`**CountrySelectModal**` — uses existing shadcn/ui `Dialog`, `Select`, and `RadioGroup` components. "Continue" button disabled until country is selected (and doc type if required).

**URL params** — selection passed as `?country=HR&docType=passport` to `/validate` so the page is shareable and back-navigation works cleanly.

**Server** — `validatePhoto(imageBuffer, widthMm?, heightMm?)` uses passed dims or falls back to `ICAOConfig` defaults (35×45). The existing `processImage` → `validateFinalGeometry` pipeline is unaffected; only the target pixel dimensions change.



## Look  
**Option B — Modal with a searchable Combobox + card-style doc type picker**

A Dialog with a Combobox (type to filter countries, with flag emoji next to each name). When a country with differing dimensions is selected, two large clickable cards appear side-by-side — one for Passport, one for Driver's License, each with an icon and the exact dimensions shown (e.g. "35 × 45 mm").

- Pro: Fast filtering, visually clear, dimensions are visible so user can self-verify

- Con: Needs a Combobox component (shadcn has one, but it needs wiring)

