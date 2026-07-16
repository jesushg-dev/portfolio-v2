"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

interface ThemeSelectorLazyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ThemeSelector = dynamic(() => import("./theme-selector"), {
  ssr: false,
});

export default function ThemeSelectorLazy({
  open,
  onOpenChange,
}: ThemeSelectorLazyProps) {
  const [hasOpened, setHasOpened] = useState(open);

  if (open && !hasOpened) {
    setHasOpened(true);
  }

  if (!hasOpened) return null;

  return <ThemeSelector open={open} onOpenChange={onOpenChange} />;
}
