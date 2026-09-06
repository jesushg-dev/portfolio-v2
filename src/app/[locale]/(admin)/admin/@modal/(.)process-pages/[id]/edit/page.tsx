import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditProcessPageModal({ params }: Props) {
  const { locale, id } = await params;
  redirect(`/${locale}/admin/process-pages/${id}/edit`);
}
