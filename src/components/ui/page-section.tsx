import { cn } from "@/lib/utils";

interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PageSection({ className, ...props }: PageSectionProps) {
  return (
    <section
      className={cn("py-8 sm:py-12", className)}
      {...props}
    />
  );
}
