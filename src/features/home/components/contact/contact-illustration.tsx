import type { FC } from "react";

import { ContactGlobe, type OwnerMapLocation } from "./contact-globe";

interface ContactIllustrationProps {
  location: OwnerMapLocation | null;
}

const ContactIllustration: FC<ContactIllustrationProps> = ({ location }) => {
  if (!location) return null;

  return (
    <div className="relative hidden h-80 w-full md:block lg:h-96">
      <ContactGlobe location={location} />
    </div>
  );
};

export default ContactIllustration;
