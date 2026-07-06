import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import ForgotPasswordForm from "@/features/auth/components/forgot-password-form";

interface IForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

const ForgotPasswordPage: FC<IForgotPasswordPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we&apos;ll generate a reset link.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
};

export default ForgotPasswordPage;
