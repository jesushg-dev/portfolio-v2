import type { FC } from "react";
import { Suspense } from "react";

export { generateMetadata } from "./metadata";

import LoginForm from "@/features/auth/components/login-form";
import { env } from "@/env";

const LoginPage: FC = () => {
  return (
    <Suspense fallback={null}>
      <LoginForm
        socialProviders={{
          github: !!env.GITHUB_CLIENT_ID,
          google: !!env.GOOGLE_CLIENT_ID,
        }}
      />
    </Suspense>
  );
};

export default LoginPage;
