"use client";

import type { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIOSDevice } from "./hooks/use-ios-device";

interface IOSWindowProps {
  children: ReactNode;
  className?: string;
}

export const IOSWindow: FC<IOSWindowProps> = ({ children, className }) => {
  const { topBarHeight, bottomHomeBarHeight } = useIOSDevice();

  return (
    <div
      className={cn(
        "relative flex size-full flex-col overflow-hidden bg-black text-white",
        className,
      )}
      style={{
        paddingTop: `${topBarHeight}px`,
        paddingBottom: `${bottomHomeBarHeight}px`,
      }}
    >
      {children}
    </div>
  );
};

export default IOSWindow;
