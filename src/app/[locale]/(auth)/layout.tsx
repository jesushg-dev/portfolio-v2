import type { FC, ReactNode } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import AuthShell from "@/features/auth/components/auth-shell";

interface IAuthLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const AuthLayout: FC<IAuthLayoutProps> = async ({ children, params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <AuthShell>{children}</AuthShell>;
};

export default AuthLayout;
