import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import RegisterForm from "@/features/auth/components/register-form";

interface IRegisterPageProps {
  params: Promise<{ locale: string }>;
}

const RegisterPage: FC<IRegisterPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Create your portfolio
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Get your own subdomain in seconds.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
