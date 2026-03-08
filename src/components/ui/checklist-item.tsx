import * as React from "react"
import { CheckCircle, type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const checklistIconVariants = cva("mt-0.5 flex-shrink-0", {
  variants: {
    variant: {
      default: "text-success",
      amber: "text-warning",
      emerald: "text-success",
      blue: "text-info",
      gray: "text-muted-foreground",
    },
    size: {
      default: "w-5 h-5 mr-3",
      sm: "w-4 h-4 mr-2",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

const checklistTextVariants = cva("", {
  variants: {
    variant: {
      default: "text-foreground",
      amber: "text-warning-foreground",
      emerald: "text-foreground",
      blue: "text-foreground",
      gray: "text-muted-foreground",
    },
    size: {
      default: "text-sm sm:text-base",
      sm: "text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

type ChecklistItemProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof checklistIconVariants> & {
    icon?: LucideIcon
    iconClassName?: string
  }

const ChecklistItem = React.forwardRef<HTMLDivElement, ChecklistItemProps>(
  (
    {
      children,
      icon: Icon = CheckCircle,
      iconClassName,
      variant,
      size,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("flex items-start", className)} {...props}>
        <Icon
          className={cn(checklistIconVariants({ variant, size }), iconClassName)}
        />
        <span className={cn(checklistTextVariants({ variant, size }))}>
          {children}
        </span>
      </div>
    )
  }
)
ChecklistItem.displayName = "ChecklistItem"

export { ChecklistItem }
