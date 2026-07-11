"use client";

import type { FC, ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface ICvAddButtonProps {
  children: ReactNode;
  onClick: () => void;
  id?: string;
}

const CvAddButton: FC<ICvAddButtonProps> = ({ children, onClick, id }) => (
  <Button id={id} variant="outline" type="button" onClick={onClick}>
    {children}
  </Button>
);

export default CvAddButton;
