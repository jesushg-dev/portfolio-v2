import { type ComponentProps, type ReactNode } from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

interface InputProps extends ComponentProps<"input"> {
  icon?: ReactNode;
}

function Input({ className, type, value, icon, ...props }: InputProps) {
  const isCheckable = type === "checkbox" || type === "radio";
  const controlledProps =
    value !== undefined && !isCheckable ? { value: value ?? "" } : { value };

  const inputElement = (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "border-input bg-background text-foreground file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 h-8 w-full min-w-0 rounded-lg border px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
        className,
        icon && "pl-10", // espacio para el ícono
      )}
      {...props}
      {...controlledProps}
    />
  );

  if (icon) {
    return (
      <div className="relative w-full">
        <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
          {icon}
        </span>
        {inputElement}
      </div>
    );
  }

  return inputElement;
}

export { Input };
