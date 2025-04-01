"use client";

import React from "react";
import type { FC } from "react";
import Image from "next/image";

const ClientImage: FC = () => {
  return (
    <div className="mx-5 table">
      <div className="overflow-hidden bg-white shadow-lg">
        <Image
          alt="Jesús Hernández photo"
          loading="lazy"
          width={100}
          height={150}
          decoding="async"
          src="https://res.cloudinary.com/js-media/image/upload/v1687726418/portfolio/carnet/jesus-hernandez.crop_xqewhg.webp"
          style={{ objectFit: "cover" }}
        />
      </div>
    </div>
  );
};

export default ClientImage;
