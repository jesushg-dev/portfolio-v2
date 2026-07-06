import type { FC, ReactNode } from "react";
import type { Locale } from "next-intl";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { auth } from "@/lib/auth";
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
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <TooltipProvider>
      <DashboardShell userName={session.user.name ?? session.user.email}>
        {children}
      </DashboardShell>
    </TooltipProvider>
  );
};

export default DashboardLayout;
