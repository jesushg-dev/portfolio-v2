"use client";
import { type TextareaHTMLAttributes, forwardRef } from "react";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "focus-visible:ring-ring/50 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring flex w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
