import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function NewProcessPageModal({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/admin/process-pages/new`);
}
