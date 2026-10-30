"use client";

import { type ComponentProps } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Sheet(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: DialogPrimitive.Popup.Props & { side?: "left" | "right" }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black/40 duration-200" />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "bg-background text-foreground data-open:animate-in data-closed:animate-out fixed inset-y-0 z-50 flex h-dvh w-full flex-col overflow-hidden border p-4 shadow-xl duration-300 outline-none sm:max-w-lg",
          side === "left"
            ? "data-open:slide-in-from-left data-closed:slide-out-to-left left-0 border-r"
            : "data-open:slide-in-from-right data-closed:slide-out-to-right right-0 border-l",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-2"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle };
