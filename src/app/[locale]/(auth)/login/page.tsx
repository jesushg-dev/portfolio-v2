import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import LoginForm from "@/features/auth/components/login-form";
import { env } from "@/env";

interface ILoginPageProps {
  params: Promise<{ locale: string }>;
}

const LoginPage: FC<ILoginPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <LoginForm
      socialProviders={{
        github: !!env.GITHUB_CLIENT_ID,
        google: !!env.GOOGLE_CLIENT_ID,
      }}
    />
  );
};

export default LoginPage;
