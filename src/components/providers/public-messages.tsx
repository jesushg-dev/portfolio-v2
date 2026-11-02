import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getPublicLocale } from "@/lib/public-site/locale";
import {
  pickPublicRouteMessages,
  type PublicMessageScope,
} from "@/lib/public-site/messages";

export default async function PublicMessages({
  children,
  scope,
}: {
  children: ReactNode;
  scope: PublicMessageScope;
}) {
  const locale = await getPublicLocale();
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={pickPublicRouteMessages(messages, scope)}>
      {children}
    </NextIntlClientProvider>
  );
}
