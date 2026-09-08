import type { Metadata } from "next";

import { createTranslatedMetadata } from "@/lib/seo/create-translated-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return createTranslatedMetadata(params, {
    namespace: "auth.twoFactor",
    titleKey: "title",
    descriptionKey: "metaDescription",
    pathname: "/two-factor",
  });
}
