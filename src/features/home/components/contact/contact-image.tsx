"use client";

import { type FC } from "react";

import { MediaImage } from "@/components/shared/media-image";

const CONTACT_IMAGE_URL =
  "https://res.cloudinary.com/js-media/image/upload/v1642524352/portfolio/contactme.gif";

const ContactImage: FC = () => {
  return (
    <MediaImage
      width={600}
      height={600}
      src={CONTACT_IMAGE_URL}
      alt="hero-contact"
      className="mx-auto hidden w-1/2 lg:block"
    />
  );
};

export default ContactImage;
