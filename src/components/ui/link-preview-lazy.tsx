"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const LinkPreview = dynamic(
  () => import("@/components/ui/link-preview").then((mod) => mod.LinkPreview),
  { ssr: false, loading: () => null },
);

type LinkPreviewLazyProps = ComponentProps<typeof LinkPreview>;

export function LinkPreviewLazy(props: LinkPreviewLazyProps) {
  return <LinkPreview {...props} />;
}
