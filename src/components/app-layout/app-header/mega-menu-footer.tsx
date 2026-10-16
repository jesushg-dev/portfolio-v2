"use client";

import type { FC } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { homeSectionHref } from "./navigation-config";

interface MegaMenuFooterProps {
  availability: string;
  availabilityHint: string;
  scheduleCta: string;
  contactCta: string;
  onNavigate: () => void;
}

export const MegaMenuFooter: FC<MegaMenuFooterProps> = ({
  availability,
  availabilityHint,
  scheduleCta,
  contactCta,
  onNavigate,
}) => {
  return (
    <div className="border-border/50 bg-muted/40 flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5 sm:px-6">
      <div className="text-muted-foreground inline-flex items-center gap-2.5 text-xs sm:text-sm">
        <span className="relative flex size-2.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span>
          <strong className="text-foreground font-semibold">
            {availability}
          </strong>
          {" · "}
          <span>{availabilityHint}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/schedule"
          onClick={onNavigate}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 gap-1.5 rounded-full px-4 text-xs font-medium sm:text-sm",
          )}
        >
          <Calendar aria-hidden="true" className="size-3.5 opacity-80" />
          <span>{scheduleCta}</span>
        </Link>
        <Link
          href={homeSectionHref("contact")}
          onClick={onNavigate}
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "h-9 gap-1.5 rounded-full px-4 text-xs font-medium sm:text-sm",
          )}
        >
          <span>{contactCta}</span>
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default MegaMenuFooter;
