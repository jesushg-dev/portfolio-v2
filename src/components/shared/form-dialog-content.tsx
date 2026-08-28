"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const formDialogContentClassName = cn(
  "flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden p-4",
  "max-sm:fixed max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-none max-sm:rounded-none",
);

interface FormDialogContentProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  closeButtonId?: string;
  showCloseButton?: boolean;
  /** Extra controls rendered beside the title (e.g. language tabs). */
  headerExtra?: ReactNode;
  /** When true, the body scrolls (lists/content). When false, FormRoot children manage scroll. */
  bodyScroll?: boolean;
  /** Fixed footer (save/cancel, actions). Body scrolls when set. */
  footer?: ReactNode;
}

export function FormDialogContent({
  title,
  description,
  children,
  className,
  id,
  closeButtonId,
  showCloseButton = true,
  headerExtra,
  bodyScroll = false,
  footer,
}: FormDialogContentProps) {
  return (
    <DialogContent
      id={id}
      closeButtonId={closeButtonId}
      showCloseButton={showCloseButton}
      className={cn(formDialogContentClassName, className)}
    >
      <DialogHeader className="shrink-0 border-b pb-4">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="min-w-0">
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </div>
          {headerExtra}
        </div>
      </DialogHeader>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          footer || bodyScroll ? "overflow-y-auto py-4" : "overflow-hidden",
        )}
      >
        {children}
      </div>

      {footer ? (
        <div className="border-border bg-background shrink-0 border-t pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      ) : null}
    </DialogContent>
  );
}
