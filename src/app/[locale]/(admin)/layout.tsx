import type { FC, ReactNode } from "react";
import type { Locale } from "next-intl";
import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { auth } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import DashboardShell from "./dashboard-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

interface IDashboardLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const DashboardLayout: FC<IDashboardLayoutProps> = async ({
  children,
  params,
}) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (
    !session?.user ||
    typeof userId !== "string" ||
    userId.length === 0
  ) {
    return redirectToLogin(locale as Locale);
  }

  const { user } = session;

  return (
    <TooltipProvider>
      <DashboardShell userName={user.name ?? user.email}>
        {children}
      </DashboardShell>
    </TooltipProvider>
  );
};

export default DashboardLayout;
