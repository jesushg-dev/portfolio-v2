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
        "grid gap-4 sm:gap-5",
        showContactForm ? "md:grid-cols-[1.5fr_1fr]" : "mx-auto max-w-3xl",
      )}
    >
      {children}
    </div>
  );
}
