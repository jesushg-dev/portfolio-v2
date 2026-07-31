import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import type { Locale } from "next-intl";

import { auth } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import DashboardShell from "../dashboard-shell";
import TrpcProvider from "@/components/providers/trpc-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function generateMetadata(): Metadata {
  return {
    title: {
      template: "%s · Admin",
      default: "Admin",
    },
  };
}

export default async function AdminLayout({
  children,
  modal,
  params,
}: {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!session?.user || typeof userId !== "string" || userId.length === 0) {
    return redirectToLogin(locale as Locale);
  }

  const { user } = session;
  const messages = await getMessages();

  return (
    <TrpcProvider>
      <NextIntlClientProvider messages={messages}>
        <NuqsAdapter>
          <TooltipProvider>
            <DashboardShell userName={user.name ?? user.email} modal={modal}>
              {children}
            </DashboardShell>
          </TooltipProvider>
        </NuqsAdapter>
      </NextIntlClientProvider>
    </TrpcProvider>
  );
}
