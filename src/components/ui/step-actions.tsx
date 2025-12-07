import { cn } from "@/lib/utils";

interface StepActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function StepActions({ className, ...props }: StepActionsProps) {
  return (
    <div
      className={cn("flex flex-col sm:flex-row gap-3", className)}
      {...props}
    />
  );
}
