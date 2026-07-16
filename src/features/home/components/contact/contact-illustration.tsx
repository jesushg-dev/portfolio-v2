import type { FC } from "react";
import Image from "next/image";

/** Swap this URL when you have a theme-ready asset (public/ or Cloudinary). */
const CONTACT_ART_SRC =
  "https://res.cloudinary.com/js-media/image/upload/e_make_transparent:20/f_png/w_640,q_auto,c_limit/v1670990294/portfolio/hero/contactme.gif";

const ContactIllustration: FC = () => {
  return (
    <div className="relative hidden max-w-sm md:block">
      <Image
        width={640}
        height={420}
        src={CONTACT_ART_SRC}
        alt=""
        loading="lazy"
        sizes="(min-width: 768px) 640px, 0px"
        className="h-auto w-full object-contain"
      />
    </div>
  );
};

export default ContactIllustration;
