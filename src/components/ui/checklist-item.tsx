import { CheckCircle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItemProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "amber" | "emerald";
  size?: "sm" | "default";
}

const variantStyles = {
  default: { icon: "text-emerald-600", text: "text-gray-700" },
  amber: { icon: "text-amber-600", text: "text-amber-800" },
  emerald: { icon: "text-emerald-600", text: "text-emerald-800" },
};

const sizeStyles = {
  default: { icon: "w-5 h-5", text: "text-sm sm:text-base", margin: "mr-3" },
  sm: { icon: "w-4 h-4", text: "text-sm", margin: "mr-2" },
};

export function ChecklistItem({ 
  children, 
  icon: Icon = CheckCircle,
  variant = "default",
  size = "default"
}: ChecklistItemProps) {
  return (
    <div className="flex items-start">
      <Icon className={cn(
        sizeStyles[size].icon, 
        variantStyles[variant].icon,
        sizeStyles[size].margin,
        "mt-0.5 flex-shrink-0"
      )} />
      <span className={cn(variantStyles[variant].text, sizeStyles[size].text)}>
        {children}
      </span>
    </div>
  );
}

