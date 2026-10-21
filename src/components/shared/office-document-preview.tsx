"use client";

import type { FC } from "react";

import { buildOfficeEmbedUrl } from "@/lib/office-embed";
import { cn } from "@/lib/utils";

interface DocumentFilePreviewProps {
  fileUrl: string;
  title: string;
  className?: string;
}

const PREVIEW_FRAME =
  "bg-muted/30 h-[min(80dvh,56rem)] w-full rounded-lg border";

export const OfficeDocumentPreview: FC<DocumentFilePreviewProps> = ({
  fileUrl,
  title,
  className,
}) => {
  const embedUrl = buildOfficeEmbedUrl(fileUrl);
  if (!embedUrl) return null;

  return (
    <iframe
      src={embedUrl}
      title={title}
      className={cn(PREVIEW_FRAME, className)}
      loading="lazy"
      allowFullScreen
    />
  );
};

export const PdfFilePreview: FC<DocumentFilePreviewProps> = ({
  fileUrl,
  title,
  className,
}) => {
  return (
    <iframe
      src={fileUrl}
      title={title}
      className={cn(PREVIEW_FRAME, className)}
    />
  );
};
