"use client";

import type { FC } from "react";
import Image from "next/image";

interface ClientImageProps {
  src: string;
  alt?: string;
}

const ClientImage: FC<ClientImageProps> = ({ src, alt }) => {
  const isRemote = src.startsWith("http://") || src.startsWith("https://");

  return (
    <div className="mx-5 flex h-[110px] w-[90px] items-center justify-center overflow-hidden bg-white shadow-lg">
      <Image
        alt={alt ?? "Client Image"}
        loading="lazy"
        width={100}
        height={130}
        decoding="async"
        src={src}
        unoptimized={isRemote}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default ClientImage;
