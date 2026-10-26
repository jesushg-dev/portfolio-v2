"use client";

import type { FC } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CvReorderButtonsProps {
  index: number;
  total: number;
  disabled?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const CvReorderButtons: FC<CvReorderButtonsProps> = ({
  index,
  total,
  disabled = false,
  onMoveUp,
  onMoveDown,
}) => {
  if (total < 2) return null;

  return (
    <div className="flex shrink-0 flex-col -space-y-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || index === 0}
        onClick={(e) => {
          e.stopPropagation();
          onMoveUp();
        }}
        aria-label="Move up"
        className="text-muted-foreground hover:text-foreground size-6 disabled:opacity-20"
      >
        <ChevronUp className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || index === total - 1}
        onClick={(e) => {
          e.stopPropagation();
          onMoveDown();
        }}
        aria-label="Move down"
        className="text-muted-foreground hover:text-foreground size-6 disabled:opacity-20"
      >
        <ChevronDown className="size-3.5" />
      </Button>
    </div>
  );
};

export default CvReorderButtons;
