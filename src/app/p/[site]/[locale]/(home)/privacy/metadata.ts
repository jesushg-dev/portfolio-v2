import type { Metadata } from "next";

import { createPublicTranslatedMetadata as createTranslatedMetadata } from "@/lib/public-site/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return createTranslatedMetadata(params, {
    namespace: "legal.privacy",
    pathname: "/privacy",
  });
}
