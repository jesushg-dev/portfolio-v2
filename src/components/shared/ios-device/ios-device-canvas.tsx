"use client";

import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

export function IOSDeviceCanvas({
  className,
  ...props
}: ComponentPropsWithRef<"canvas">) {
  return <canvas {...props} className={cn("pointer-events-none", className)} />;
}
