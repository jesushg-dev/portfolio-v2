import type { FC } from "react";
import Image from "next/image";

import { Link } from "@/i18n/routing";

const AuthBrandHeader: FC = () => {
  return (
    <Link
      href="/"
      className="text-foreground inline-flex items-center gap-2 text-sm font-medium"
    >
      <Image
        alt="Jehg"
        width={28}
        height={28}
        src="/icon-192x192.png"
        className="rounded-sm"
      />
      <span>Jehg.</span>
    </Link>
  );
};

export default AuthBrandHeader;
