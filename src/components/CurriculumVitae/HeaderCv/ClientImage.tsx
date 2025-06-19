"use client";

import React from "react";
import type { FC } from "react";
import Image from "next/image";

interface ClientImageProps {
  alt?: string;
}

const ClientImage: FC<ClientImageProps> = ({ alt }) => {
  return (
    <div className="mx-5 flex h-[110px] w-[90px] items-center justify-center overflow-hidden bg-white shadow-lg">
      <Image
        alt={alt ?? "Client Image"}
        loading="lazy"
        width={100}
        height={130}
        decoding="async"
        src="https://res.cloudinary.com/js-media/image/upload/f_auto,q_auto/v1/portfolio/carnet/s6ipqdnq2farzggipn78"
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default ClientImage;
