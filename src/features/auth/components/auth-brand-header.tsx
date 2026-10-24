import type { FC } from "react";
import Image from "next/image";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface AuthBrandHeaderProps {
  dark?: boolean;
}

const AuthBrandHeader: FC<AuthBrandHeaderProps> = ({ dark = false }) => {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex h-11 min-h-11 items-center gap-2 text-sm font-medium",
        "text-foreground",
      )}
    >
      <span
        className={cn(
          "grid size-8 place-items-center rounded-lg",
          dark ? "bg-primary/10 ring-primary/40 ring-1" : "bg-muted/60",
        )}
      >
        <Image
          alt="Jehg"
          width={28}
          height={28}
          src="/icon-192x192.png"
          className="size-7 rounded-sm"
        />
      </span>
      <span>Jehg.</span>
    </Link>
  );
};

export default AuthBrandHeader;
