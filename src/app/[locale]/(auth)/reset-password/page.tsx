import { Suspense } from "react";
import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import ResetPasswordForm from "./reset-password-form";

interface IResetPasswordPageProps {
  params: Promise<{ locale: string }>;
}

const ResetPasswordPage: FC<IResetPasswordPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Use the token from your reset link to update your password.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
};

export default ResetPasswordPage;
