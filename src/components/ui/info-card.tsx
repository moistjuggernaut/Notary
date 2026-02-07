import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const infoCardVariants = cva("rounded-lg p-4 sm:p-6 border-l-4", {
  variants: {
    variant: {
      info: "bg-info/10 border-info",
      success: "bg-success/10 border-success",
      warning: "bg-warning/10 border-warning",
      error: "bg-destructive/10 border-destructive",
    },
  },
  defaultVariants: {
    variant: "info",
  },
})

const infoCardTitleVariants = cva("text-lg font-semibold mb-3", {
  variants: {
    variant: {
      info: "text-info-foreground",
      success: "text-foreground",
      warning: "text-warning-foreground",
      error: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "info",
  },
})

const infoCardTextVariants = cva("", {
  variants: {
    variant: {
      info: "text-foreground",
      success: "text-foreground",
      warning: "text-foreground",
      error: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "info",
  },
})

const infoCardIconVariants = cva("w-6 h-6 mt-0.5 mr-3 flex-shrink-0", {
  variants: {
    variant: {
      info: "text-info",
      success: "text-success",
      warning: "text-warning",
      error: "text-destructive",
    },
  },
  defaultVariants: {
    variant: "info",
  },
})

type InfoCardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof infoCardVariants> & {
    icon?: LucideIcon
    title?: string
  }

const InfoCard = React.forwardRef<HTMLDivElement, InfoCardProps>(
  ({ variant, icon: Icon, title, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(infoCardVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start">
          {Icon && (
            <Icon className={cn(infoCardIconVariants({ variant }))} />
          )}
          <div className="flex-1">
            {title && (
              <h3 className={cn(infoCardTitleVariants({ variant }))}>
                {title}
              </h3>
            )}
            <div className={cn(infoCardTextVariants({ variant }))}>
              {children}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
InfoCard.displayName = "InfoCard"

export { InfoCard, infoCardVariants }
