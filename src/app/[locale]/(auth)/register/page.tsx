import type { FC } from "react";
import { Suspense } from "react";

export { generateMetadata } from "./metadata";

import RegisterForm from "@/features/auth/components/register-form";

const RegisterPage: FC = () => {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
};

export default RegisterPage;
