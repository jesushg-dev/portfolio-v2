"use client";

import type { FC, ReactNode } from "react";

interface ICvAddButtonProps {
  children: ReactNode;
  onClick: () => void;
}

const CvAddButton: FC<ICvAddButtonProps> = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
  >
    {children}
  </button>
);

export default CvAddButton;
