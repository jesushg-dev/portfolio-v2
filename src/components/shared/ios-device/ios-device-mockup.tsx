"use client";

import type { FC, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";
import { IOSSafeAreaProvider } from "./ios-safe-area-context";
import { IOSDynamicIsland } from "./ios-dynamic-island";
import { IOSHomeBar } from "./ios-home-bar";
import { IOSDeviceChassisCanvas } from "./ios-device-chassis-canvas";
import styles from "./ios-device-mockup.module.css";

interface DeviceFrameProps {
  children: ReactNode;
  className?: string;
}

export type IOSDeviceMockupProps = DeviceFrameProps &
  (
    | {
        variant?: "iphone-16-pro" | "iphone-se";
        screenRef?: Ref<HTMLDivElement>;
        depth?: boolean;
        screenClassName?: never;
        bezel?: never;
        model?: never;
      }
    | {
        variant: "foldable";
        screenClassName: string;
        bezel?: ReactNode;
        screenRef?: Ref<HTMLDivElement>;
        model?: never;
        depth?: never;
      }
    | {
        variant: "model";
        model: ReactNode;
        screenRef?: never;
        screenClassName?: never;
        bezel?: never;
        depth?: never;
      }
  );

export const IOSDeviceMockup: FC<IOSDeviceMockupProps> = ({
  children,
  className,
  variant,
  model,
  screenRef,
  screenClassName,
  bezel,
  depth,
}) => {
  if (variant === "model") {
    return (
      <div className={cn(styles.dimensions, className)}>
        {model}
        {children}
      </div>
    );
  }

  if (variant === "foldable") {
    return (
      <div className={className}>
        {bezel}
        <div ref={screenRef} className={screenClassName}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <IOSSafeAreaProvider>
      <div
        className={cn(
          "relative mx-auto h-(--ios-device-height) w-(--ios-device-width) rounded-(--ios-device-frame-radius) border-[0.1875rem] border-zinc-700 bg-zinc-800 shadow-2xl",
          styles.dimensions,
          depth && styles.depth,
          className,
        )}
      >
        {depth && <IOSDeviceChassisCanvas />}
        {/* Hardware Side Buttons */}
        <div className={styles.hardware} aria-hidden="true">
          <div className="absolute top-16.5 -left-1.25 h-7 w-0.5 rounded-s-sm bg-zinc-600" />
          <div className="absolute top-26.5 -left-1.25 h-10 w-0.5 rounded-s-sm bg-zinc-600" />
          <div className="absolute top-37.5 -left-1.25 h-10 w-0.5 rounded-s-sm bg-zinc-600" />
          <div className="absolute top-29 -right-1.25 h-12 w-0.5 rounded-e-sm bg-zinc-600" />
        </div>

        {/* Screen Viewport */}
        <div
          ref={screenRef}
          data-ios-texture-source={depth ? "" : undefined}
          className="text-foreground absolute inset-[calc(var(--ios-device-screen-inset)-0.1875rem)] touch-pan-y overflow-hidden overscroll-contain rounded-(--ios-device-screen-radius) bg-black"
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
