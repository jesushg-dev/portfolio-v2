import type { FC } from "react";
import type { Locale } from "next-intl";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import RegisterForm from "@/features/auth/components/register-form";

interface IRegisterPageProps {
  params: Promise<{ locale: string }>;
}

const RegisterPage: FC<IRegisterPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
};

export default RegisterPage;
