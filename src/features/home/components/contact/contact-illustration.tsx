import type { FC } from "react";

import { ContactGlobe, type OwnerMapLocation } from "./contact-globe";

interface ContactIllustrationProps {
  location: OwnerMapLocation | null;
}

const ContactIllustration: FC<ContactIllustrationProps> = ({ location }) => {
  if (!location) return null;

  return (
    <div className="relative mt-2 flex h-72 w-full flex-col sm:h-80 lg:h-96">
      <ContactGlobe location={location} />
    </div>
  );
};

export default ContactIllustration;
