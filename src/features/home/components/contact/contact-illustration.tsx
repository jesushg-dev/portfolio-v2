import type { FC } from "react";

import { ContactGlobe } from "./contact-globe";

/**
 * Decorative aside in the contact section.
 * Shows an interactive D3 globe that animates a connection from the
 * visitor's detected IP location to Managua (portfolio owner).
 */
const ContactIllustration: FC = () => {
  return (
    <div className="relative hidden h-72 w-full md:block lg:h-80">
      <ContactGlobe />
    </div>
  );
};

export default ContactIllustration;
