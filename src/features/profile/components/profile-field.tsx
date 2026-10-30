import type { FC, ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ProfileFieldProps {
  label: string;
  description?: string;
  inputId: string;
  children: ReactNode;
  className?: string;
}

export const ProfileField: FC<ProfileFieldProps> = ({
  label,
  description,
  inputId,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId} className="text-foreground text-sm font-medium">
        {label}
      </Label>
      {children}
      {description && (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
