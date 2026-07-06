"use client";

import { type ReactNode } from "react";
import { PageDialogWrapper } from "@/components/shared/page-container";

interface ModalWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * ModalWrapper — renders children inside a Dialog modal.
 * Used by parallel route (@modal) intercepted pages.
 * Closing the dialog navigates back via router.back().
 */
export function ModalWrapper({
  title,
  description,
  children,
  className,
}: ModalWrapperProps) {
  return (
    <PageDialogWrapper
      title={title}
      description={description}
      className={className}
    >
      {children}
    </PageDialogWrapper>
  );
}
