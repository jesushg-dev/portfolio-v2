import type { FC } from "react";
import ViewportSection from "@/components/shared/viewport-section";
import { Skeleton } from "@/components/ui/skeleton";

import { ContactGlobe, type OwnerMapLocation } from "./contact-globe";

interface ContactIllustrationProps {
  location: OwnerMapLocation | null;
}

const ContactIllustration: FC<ContactIllustrationProps> = ({ location }) => {
  if (!location) return null;

  return (
    <div className="relative mt-2 flex h-72 w-full flex-col sm:h-80 lg:h-96">
      <ViewportSection
        fallback={<Skeleton className="h-full w-full rounded-2xl" />}
        minHeight="18rem"
        className="h-full"
      >
        <ContactGlobe location={location} />
      </ViewportSection>
    </div>
  );
};

export default ContactIllustration;
