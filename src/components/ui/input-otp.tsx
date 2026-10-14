"use client";

import { type ComponentProps, useContext } from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Minus } from "lucide-react";

import { cn } from "@/lib/utils";

function InputOTP({
  className,
  containerClassName,
  onKeyDown,
  pasteTransformer,
  ...props
}: ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName,
      )}
      spellCheck={false}
      className={cn("disabled:cursor-not-allowed", className)}
      pasteTransformer={
        pasteTransformer ?? ((pasted) => pasted.replace(/\s+/g, ""))
      }
      onKeyDown={(event) => {
        if (event.key === " ") {
          event.preventDefault();
        }
        onKeyDown?.(event);
      }}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        "border-input bg-background has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20 flex items-center rounded-xl border shadow-xs has-aria-invalid:ring-3",
        className,
      )}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "border-input text-foreground aria-invalid:border-destructive data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 relative flex h-11 w-10 items-center justify-center border-r font-mono text-base font-medium transition-colors outline-none first:rounded-l-xl last:rounded-r-xl last:border-r-0 data-[active=true]:z-10 data-[active=true]:ring-3 sm:size-11",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="bg-foreground animate-caret-blink h-4 w-0.5 duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      className={cn("text-muted-foreground flex items-center", className)}
      role="separator"
      {...props}
    >
      <Minus className="size-4" />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
