import type { ReactNode } from "react";
import PublicMessages from "@/components/providers/public-messages";
import { TRPCReactProvider } from "@/trpc/react";

export default function BlogRouteLayout({ children }: { children: ReactNode }) {
  return (
    <PublicMessages scope="blog">
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </PublicMessages>
  );
}
