import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

type Step = {
  id: number
  label: string
}

type StepperProps = React.HTMLAttributes<HTMLDivElement> & {
  steps: Step[]
  currentStep: number
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ steps, currentStep, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id
            const isCurrent = currentStep === step.id

            return (
              <div key={step.id} className="flex items-start flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                      isCompleted &&
                        "bg-success/10 border-success text-success",
                      isCurrent &&
                        "bg-primary/10 border-primary text-primary ring-2 ring-primary/30",
                      !isCompleted &&
                        !isCurrent &&
                        "bg-background border-border text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">{step.id}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-1.5 text-xs font-medium",
                      isCompleted || isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mt-4 transition-all",
                      isCompleted ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
Stepper.displayName = "Stepper"

export { Stepper }

// Preserve default export for backward compatibility
export default Stepper
