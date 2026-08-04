"use client";

import { isValidElement, type ReactElement, type ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HintProps {
  label: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "center" | "end" | "start";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Hint = ({
  children,
  label,
  align,
  side,
  open,
  onOpenChange,
}: HintProps) => {
  return (
    <TooltipProvider delay={50}>
      <Tooltip open={open} onOpenChange={onOpenChange}>
        {isValidElement(children) ? (
          <TooltipTrigger render={children as ReactElement} />
        ) : (
          <TooltipTrigger>{children}</TooltipTrigger>
        )}
        <TooltipContent
          side={side}
          align={align}
          className="z-[1000] max-w-44 border-white/5 bg-[#1F1F1F] text-white"
        >
          <p className="text-medium text-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
