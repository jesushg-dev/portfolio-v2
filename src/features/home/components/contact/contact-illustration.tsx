import type { FC } from "react";

import { ContactGlobe, type OwnerMapLocation } from "./contact-globe";

interface ContactIllustrationProps {
  location: OwnerMapLocation | null;
}

const ContactIllustration: FC<ContactIllustrationProps> = ({ location }) => {
  if (!location) return null;

  return (
    <div className="relative hidden h-72 w-full md:block lg:h-80">
      <ContactGlobe location={location} />
    </div>
  );
};

export default ContactIllustration;
