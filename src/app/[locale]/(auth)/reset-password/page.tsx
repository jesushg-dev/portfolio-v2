import { Suspense } from "react";
import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export { generateMetadata } from "./metadata";

import ResetPasswordForm from "@/features/auth/components/reset-password-form";

interface IResetPasswordPageProps {
  params: Promise<{ locale: string }>;
}

const ResetPasswordPage: FC<IResetPasswordPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
