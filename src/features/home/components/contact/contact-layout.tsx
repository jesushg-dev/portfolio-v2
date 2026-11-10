import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ContactLayout({
  children,
  showContactForm,
}: {
  children: ReactNode;
  showContactForm: boolean;
}) {
  return (
    <div
      className={cn(
        "border-border/50 bg-card/15 relative grid items-stretch overflow-hidden rounded-[2.5rem] border shadow-sm backdrop-blur-xl",
        showContactForm && "lg:grid-cols-2",
      )}
    >
      {children}
    </div>
  );
}
