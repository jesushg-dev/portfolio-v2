"use client";

import { useState, type FC, type ReactNode } from "react";

import { buildOfficeEmbedUrl } from "@/lib/office-embed";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface OfficeDocumentPreviewProps {
  fileUrl: string;
  title: string;
  openLabel: string;
  closeLabel: string;
  className?: string;
  defaultOpen?: boolean;
  /** Buttons rendered before the preview toggle on the same row. */
  leadingActions?: ReactNode;
  /** Buttons rendered after the preview toggle on the same row. */
  trailingActions?: ReactNode;
}

export const OfficeDocumentPreview: FC<OfficeDocumentPreviewProps> = ({
  fileUrl,
  title,
  openLabel,
  closeLabel,
  className,
  defaultOpen = false,
  leadingActions,
  trailingActions,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const embedUrl = buildOfficeEmbedUrl(fileUrl);
  if (!embedUrl) return null;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {leadingActions}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {open ? closeLabel : openLabel}
        </Button>
        {trailingActions}
      </div>
      {open ? (
        <iframe
          src={embedUrl}
          title={title}
          className="bg-muted/30 mt-3 h-[min(65vh,480px)] w-full rounded-lg border"
          loading="lazy"
          allowFullScreen
        />
      ) : null}
    </div>
  );
};
