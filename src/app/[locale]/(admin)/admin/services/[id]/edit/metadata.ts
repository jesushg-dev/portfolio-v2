import type { Metadata } from "next";

import { createTranslatedMetadata } from "@/lib/seo/create-translated-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return createTranslatedMetadata(params, {
    namespace: "admin.services",
    titleKey: "edit",
    descriptionKey: "editDescription",
  });
}
