import type { ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";

import type { Locale } from "@/i18n/config";
import AuthShell from "@/features/auth/components/auth-shell";
import TrpcProvider from "@/components/providers/trpc-provider";
import { auth } from "@/lib/auth";
import { redirectToAdmin } from "@/lib/auth-redirect";

export function generateMetadata(): Metadata {
  return {
    title: {
      template: "%s · Jehg",
      default: "Jehg",
    },
  };
}

interface IAuthLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AuthLayout({
  children,
  params,
}: IAuthLayoutProps) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (session?.user && typeof userId === "string" && userId.length > 0) {
    return redirectToAdmin(locale as Locale);
  }

  return (
    <TrpcProvider>
      <AuthShell>{children}</AuthShell>
    </TrpcProvider>
  );
}

