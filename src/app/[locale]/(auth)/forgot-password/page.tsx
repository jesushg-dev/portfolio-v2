import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export { generateMetadata } from "./metadata";

import ForgotPasswordForm from "@/features/auth/components/forgot-password-form";

interface IForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

const ForgotPasswordPage: FC<IForgotPasswordPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <ForgotPasswordForm />;
};

export default ForgotPasswordPage;
