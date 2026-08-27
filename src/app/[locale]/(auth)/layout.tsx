import type { FC, ReactNode } from "react";
import type { Metadata } from "next";

import AuthShell from "@/features/auth/components/auth-shell";
import TrpcProvider from "@/components/providers/trpc-provider";

export function generateMetadata(): Metadata {
  return {
    title: {
      template: "%s · Jehg",
      default: "Jehg",
    },
  };
}

interface IAuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: FC<IAuthLayoutProps> = ({ children }) => {
  return (
    <TrpcProvider>
      <AuthShell>{children}</AuthShell>
    </TrpcProvider>
  );
};

export default AuthLayout;
