import { Suspense } from "react";
import type { FC } from "react";

export { generateMetadata } from "./metadata";

import TwoFactorVerifyForm from "@/features/auth/components/two-factor-verify-form";

const TwoFactorPage: FC = () => {
  return (
    <Suspense fallback={null}>
      <TwoFactorVerifyForm />
    </Suspense>
  );
};

export default TwoFactorPage;
