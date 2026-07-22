import type { FC, ReactNode } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import AuthShell from "@/features/auth/components/auth-shell";
import TrpcProvider from "@/components/providers/trpc-provider";

interface IAuthLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const AuthLayout: FC<IAuthLayoutProps> = async ({ children, params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <TrpcProvider>
      <AuthShell>{children}</AuthShell>
    </TrpcProvider>
  );
};

export default AuthLayout;
