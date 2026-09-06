"use client";

import type { AppLanguage } from "@prisma/client";
import dynamic from "next/dynamic";

import { ProcessPageRouteFallback } from "@/features/process-pages/components/process-page-route-fallback";
import type { ProcessPageFormValues } from "@/features/process-pages/lib/process-page-editor-dto";

const ProcessPageForm = dynamic(
  () =>
    import("@/features/process-pages/components/admin/process-page-form").then(
      (mod) => mod.ProcessPageForm,
    ),
  {
    ssr: false,
    loading: () => <ProcessPageRouteFallback />,
  },
);

export function ProcessPageFormLazy({
  languages,
  initialData,
}: {
  languages: AppLanguage[];
  initialData: ProcessPageFormValues;
}) {
  return <ProcessPageForm initialData={initialData} languages={languages} />;
}
