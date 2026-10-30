import type { ReactNode } from "react";
import PublicMessages from "@/components/providers/public-messages";
import { TRPCReactProvider } from "@/trpc/react";

export default function RouteLayout({ children }: { children: ReactNode }) {
  return (
    <PublicMessages scope="certificates">
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </PublicMessages>
  );
}
