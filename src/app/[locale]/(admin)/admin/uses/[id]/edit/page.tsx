export { generateMetadata } from "../../metadata";
import { UsesItemForm } from "@/features/uses/components/admin/uses-item-form";
import { getUsesItemEditPageData } from "@/features/uses/server/uses-queries";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditUsesItemPage({ params }: Props) {
  const { id } = await params;
  const [t, { editorDto, languages }] = await Promise.all([
    getTranslations("admin.uses"),
    getUsesItemEditPageData(id),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("editTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("editDescription")}
        </p>
      </div>
      <UsesItemForm initialData={editorDto} languages={languages} />
    </div>
  );
}
