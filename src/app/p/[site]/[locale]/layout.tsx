import type { ReactNode } from "react";
import DocumentRoot from "@/app/_components/document-root";
import { getPublicLocale } from "@/lib/public-site/locale";
import { locales } from "@/i18n/config";
import { site } from "next/root-params";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { resolvePublicTenant } from "@/lib/public-site/tenant";
import { getMessages } from "next-intl/server";
import { pickPublicMessages } from "@/lib/public-site/messages";

export { metadata } from "@/app/_components/document-root";
export const revalidate = 7200;

export function generateStaticParams() {
  return locales.map((locale) => ({ site: "primary", locale }));
}

export default async function PublicRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getPublicLocale();
  if ((await site()) !== "primary") await connection();
  if (!(await resolvePublicTenant())) notFound();
  const messages = pickPublicMessages(await getMessages({ locale }));
  return (
    <DocumentRoot locale={locale} messages={messages}>
      {children}
    </DocumentRoot>
  );
}
