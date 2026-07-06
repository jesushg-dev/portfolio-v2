"use client";

import { type FC } from "react";

import Image from "next/image";
import { cloudinaryLoader } from "@/utils/tools/image";

const ContactImage: FC = () => {
  return (
    <Image
      width={600}
      height={600}
      src="contactme.gif"
      alt="hero-contact"
      loader={cloudinaryLoader}
      className="mx-auto hidden w-1/2 lg:block"
    />
  );
};

export default ContactImage;
