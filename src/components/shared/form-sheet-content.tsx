"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface FormSheetContentProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  headerExtra?: ReactNode;
  bodyScroll?: boolean;
  footer?: ReactNode;
}

export function FormSheetContent({
  title,
  description,
  children,
  className,
  id,
  headerExtra,
  bodyScroll = true,
  footer,
}: FormSheetContentProps) {
  return (
    <SheetContent
      id={id}
      side="right"
      className={cn(
        "bg-card text-card-foreground border-border flex h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[45rem]",
        className,
      )}
    >
      <SheetHeader className="border-border bg-card/95 shrink-0 border-b px-5 py-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3 pr-10">
          <div className="min-w-0">
            <SheetTitle className="text-foreground text-xl font-semibold tracking-tight">
              {title}
            </SheetTitle>
            {description ? (
              <SheetDescription className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
                {description}
              </SheetDescription>
            ) : (
              <SheetDescription className="sr-only">
                {typeof title === "string" ? title : "Sheet details"}
              </SheetDescription>
            )}
          </div>
          {headerExtra ? <div className="shrink-0">{headerExtra}</div> : null}
        </div>
      </SheetHeader>

      <div
        className={cn(
          "min-h-0 flex-1 px-5 py-5",
          bodyScroll && "overflow-y-auto overscroll-contain",
        )}
      >
        {children}
      </div>

      {footer ? (
        <footer className="border-border bg-card/95 shrink-0 border-t px-5 py-3 backdrop-blur">
          {footer}
        </footer>
      ) : null}
    </SheetContent>
  );
}
