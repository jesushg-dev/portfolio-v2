"use client";

import type { FC, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";
import { IOSSafeAreaProvider } from "./ios-safe-area-context";
import { IOSDynamicIsland } from "./ios-dynamic-island";
import { IOSHomeBar } from "./ios-home-bar";

export interface IOSDeviceMockupProps {
  children: ReactNode;
  className?: string;
  screenRef?: Ref<HTMLDivElement>;
  variant?: "iphone-16-pro" | "iphone-se";
}

export const IOSDeviceMockup: FC<IOSDeviceMockupProps> = ({
  children,
  className,
  screenRef,
}) => {
  return (
    <IOSSafeAreaProvider>
      <div
        className={cn(
          "relative mx-auto h-153.75 w-75 rounded-4xl border-[0.1875rem] border-zinc-700 bg-zinc-800 shadow-2xl",
          className,
        )}
      >
        {/* Hardware Side Buttons */}
        <div className="absolute top-16.5 -left-1.25 h-7 w-0.5 rounded-s-sm bg-zinc-600" />
        <div className="absolute top-26.5 -left-1.25 h-10 w-0.5 rounded-s-sm bg-zinc-600" />
        <div className="absolute top-37.5 -left-1.25 h-10 w-0.5 rounded-s-sm bg-zinc-600" />
        <div className="absolute top-29 -right-1.25 h-12 w-0.5 rounded-e-sm bg-zinc-600" />

        {/* Screen Viewport */}
        <div
          ref={screenRef}
          className="text-foreground absolute inset-0.75 touch-pan-y overflow-hidden overscroll-contain rounded-[1.9rem] bg-black"
        >
          {/* Permanent Hardware Dynamic Island */}
          <IOSDynamicIsland />

          <div className="relative size-full">{children}</div>

          {/* Permanent Home Indicator Bar */}
          <IOSHomeBar />
        </div>
      </div>
    </IOSSafeAreaProvider>
  );
};

export default IOSDeviceMockup;
