import { useState } from 'react'
import { Check, BookOpen, Car, ArrowRight, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { EU_COUNTRIES, getCountryByCode, type DocType, type CountryConfig } from '@/lib/country-config'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (country: string, docType: DocType) => void
}

export function CountrySelectModal({ open, onClose, onConfirm }: Props) {
  const [searching, setSearching] = useState(true)
  const [selectedCode, setSelectedCode] = useState<string>('')
  const [selectedDocType, setSelectedDocType] = useState<DocType>('passport')

  const selectedCountry: CountryConfig | undefined = selectedCode
    ? getCountryByCode(selectedCode)
    : undefined

  const canContinue = selectedCountry !== undefined

  function handleConfirm() {
    if (!selectedCountry) return
    onConfirm(selectedCode, selectedDocType)
  }

  function handleCountrySelect(code: string) {
    setSelectedCode(code)
    setSearching(false)
    setSelectedDocType('passport')
  }

  function handleClearCountry() {
    setSelectedCode('')
    setSearching(true)
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      onClose()
      // reset state when modal closes
      setSelectedCode('')
      setSearching(true)
      setSelectedDocType('passport')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Select Issuing Country &amp; Document</DialogTitle>
          <DialogDescription>
            Choose the country and document for the passport or driver's license photo you want to validate.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Country selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Country</label>

            {searching ? (
              <Command className="border rounded-lg shadow-none">
                <CommandInput placeholder="Search country…" autoFocus />
                <CommandList className="max-h-52">
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {EU_COUNTRIES.map((country) => (
                      <CommandItem
                        key={country.code}
                        value={country.name}
                        onSelect={() => handleCountrySelect(country.code)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4 shrink-0',
                            selectedCode === country.code ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="mr-2">{country.flag}</span>
                        {country.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            ) : (
              <button
                type="button"
                onClick={() => setSearching(true)}
                className="flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>{selectedCountry?.flag}</span>
                  <span className="font-medium">{selectedCountry?.name}</span>
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ChevronDown className="h-4 w-4" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleClearCountry() }}
                    className="ml-1 rounded-sm hover:text-foreground"
                    aria-label="Clear selection"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </button>
            )}
          </div>

          {selectedCountry && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Document type</label>
              <div className="grid grid-cols-2 gap-3">
                <DocTypeCard
                  label="Passport"
                  icon={<BookOpen className="h-5 w-5" />}
                  dims={selectedCountry.passport}
                  selected={selectedDocType === 'passport'}
                  onSelect={() => setSelectedDocType('passport')}
                />
                <DocTypeCard
                  label="Driver's License"
                  icon={<Car className="h-5 w-5" />}
                  dims={selectedCountry.driversLicense}
                  selected={selectedDocType === 'drivers_license'}
                  onSelect={() => setSelectedDocType('drivers_license')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We will apply the selected country's photo size and validation rules for this document.
              </p>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!canContinue}
            onClick={handleConfirm}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type DocTypeCardProps = {
  label: string
  icon: React.ReactNode
  dims: { widthMm: number; heightMm: number }
  selected: boolean
  onSelect: () => void
}

function DocTypeCard({ label, icon, dims, selected, onSelect }: DocTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors',
        selected
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      {icon}
      <span className="text-sm font-semibold leading-tight">{label}</span>
      <span className="text-xs text-muted-foreground">
        {dims.widthMm} × {dims.heightMm} mm
      </span>
    </button>
  )
}
