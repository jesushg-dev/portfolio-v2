"use client";

import type { FC, ReactNode } from "react";

interface ICvAddButtonProps {
  children: ReactNode;
  onClick: () => void;
  id?: string;
}

const CvAddButton: FC<ICvAddButtonProps> = ({ children, onClick, id }) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors"
  >
    {children}
  </button>
);

export default CvAddButton;
