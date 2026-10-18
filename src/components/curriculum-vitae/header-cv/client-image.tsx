"use client";

import type { FC } from "react";

import { MediaImage } from "@/components/shared/media-image";

interface ClientImageProps {
  src: string;
  alt?: string;
}

const ClientImage: FC<ClientImageProps> = ({ src, alt }) => {
  return (
    <div className="size-full overflow-hidden">
      <MediaImage
        alt={alt ?? "Client Image"}
        loading="lazy"
        width={112}
        height={112}
        decoding="async"
        src={src}
        className="size-full object-cover"
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default ClientImage;
