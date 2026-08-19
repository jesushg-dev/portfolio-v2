import type { FC } from "react";

export { generateMetadata } from "./metadata";

import ForgotPasswordForm from "@/features/auth/components/forgot-password-form";

const ForgotPasswordPage: FC = () => {
  return <ForgotPasswordForm />;
};

export default ForgotPasswordPage;
