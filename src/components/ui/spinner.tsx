import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const spinnerVariants = cva("animate-spin rounded-full border-b-2", {
  variants: {
    variant: {
      default: "border-primary",
      light: "border-primary-foreground",
      muted: "border-muted-foreground",
    },
    size: {
      sm: "w-3 h-3",
      default: "w-4 h-4",
      lg: "w-6 h-6",
      xl: "w-12 h-12",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

type SpinnerProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof spinnerVariants>

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ variant, size, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ variant, size }), className)}
        role="status"
        aria-label="Loading"
        {...props}
      />
    )
  }
)
Spinner.displayName = "Spinner"

export { Spinner }
