import * as React from "react"

import { cn } from "@/lib/utils"

const RESPONSIVE_PADDING = "px-4 sm:px-6 lg:px-8"

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  full: "max-w-full",
} as const

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  maxWidth?: keyof typeof maxWidthClasses
  padding?: boolean
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ maxWidth = "6xl", padding = true, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto",
          maxWidthClasses[maxWidth],
          padding && RESPONSIVE_PADDING,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Container.displayName = "Container"

export { Container, RESPONSIVE_PADDING }
