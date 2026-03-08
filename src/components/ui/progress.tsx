"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressTrackVariants = cva("w-full rounded-full h-2", {
  variants: {
    variant: {
      default: "bg-muted",
      info: "bg-info/20",
      success: "bg-success/20",
      warning: "bg-warning/20",
      destructive: "bg-destructive/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const progressFillVariants = cva(
  "h-2 rounded-full transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        info: "bg-info",
        success: "bg-success",
        warning: "bg-warning",
        destructive: "bg-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type ProgressProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof progressTrackVariants> & {
    value: number
    max?: number
  }

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, variant, className, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div
        ref={ref}
        className={cn(progressTrackVariants({ variant }), className)}
        {...props}
      >
        <div
          className={cn(progressFillVariants({ variant }))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
