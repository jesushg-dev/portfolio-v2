import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export { generateMetadata } from "./metadata";

import { db } from "@/server/db";
import { ConsoleForm } from "@/features/profile/components/console-form";

interface Props {
  params: Promise<{ locale: string }>;
}

const ConsolePage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  return <ConsoleForm languages={languages} />;
};

export default ConsolePage;
