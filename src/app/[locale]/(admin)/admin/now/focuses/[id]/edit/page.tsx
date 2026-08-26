export { generateMetadata } from "../../../metadata";
import { getTranslations } from "next-intl/server";

import { NowFocusForm } from "@/features/now/components/admin/now-focus-form";
import { getNowFocusEditPageData } from "@/features/now/server/now-queries";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditNowFocusPage({ params }: Props) {
  const { id } = await params;
  const [t, { editorDto, languages }] = await Promise.all([
    getTranslations("admin.now"),
    getNowFocusEditPageData(id),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("editFocus")}
        </h1>
      </div>
      <NowFocusForm initialData={editorDto} languages={languages} />
    </div>
  );
}
