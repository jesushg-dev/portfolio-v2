import { Suspense } from "react";
import type { FC } from "react";

export { generateMetadata } from "./metadata";

import ResetPasswordForm from "@/features/auth/components/reset-password-form";

const ResetPasswordPage: FC = () => {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
