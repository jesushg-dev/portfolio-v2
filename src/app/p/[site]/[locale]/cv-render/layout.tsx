import type { ReactNode } from "react";
import PublicMessages from "@/components/providers/public-messages";

export default function RouteLayout({ children }: { children: ReactNode }) {
  return <PublicMessages scope="curriculum">{children}</PublicMessages>;
}
