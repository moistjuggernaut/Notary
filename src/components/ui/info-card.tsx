import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface InfoCardProps {
  variant: "info" | "success" | "warning" | "error";
  icon?: LucideIcon;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variants = {
  info: {
    container: "bg-blue-50 border-l-4 border-blue-500",
    title: "text-blue-900",
    text: "text-blue-800",
    icon: "text-blue-600",
  },
  success: {
    container: "bg-emerald-50 border-l-4 border-emerald-500",
    title: "text-emerald-900",
    text: "text-emerald-800",
    icon: "text-emerald-600",
  },
  warning: {
    container: "bg-amber-50 border-l-4 border-amber-500",
    title: "text-amber-900",
    text: "text-amber-800",
    icon: "text-amber-600",
  },
  error: {
    container: "bg-red-50 border-l-4 border-red-500",
    title: "text-red-900",
    text: "text-red-800",
    icon: "text-red-600",
  },
};

export function InfoCard({ variant, icon: Icon, title, children, className }: InfoCardProps) {
  const styles = variants[variant];
  
  return (
    <div className={cn("rounded-lg p-4 sm:p-6", styles.container, className)}>
      <div className="flex items-start">
        {Icon && <Icon className={cn("w-6 h-6 mt-0.5 mr-3 flex-shrink-0", styles.icon)} />}
        <div className="flex-1">
          {title && <h3 className={cn("text-lg font-semibold mb-3", styles.title)}>{title}</h3>}
          <div className={styles.text}>{children}</div>
        </div>
      </div>
    </div>
  );
}

