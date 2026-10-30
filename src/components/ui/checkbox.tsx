"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

export type CheckboxProps = Omit<CheckboxPrimitive.Root.Props, "checked"> & {
  checked?: boolean | "indeterminate";
};

function Checkbox({
  className,
  checked,
  indeterminate,
  ...props
}: CheckboxProps) {
  const isIndeterminate = indeterminate ?? checked === "indeterminate";
  const isChecked = checked === "indeterminate" ? false : checked;

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground relative flex size-4 shrink-0 items-center justify-center rounded border transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3",
        className,
      )}
      checked={isChecked}
      indeterminate={isIndeterminate}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon className="[[data-indeterminate]_&]:hidden" />
        <span className="hidden size-2 rounded-xs bg-current [[data-indeterminate]_&]:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
