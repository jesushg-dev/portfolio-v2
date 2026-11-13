import type { FC } from "react";
import ViewportSection from "@/components/shared/viewport-section";
import { Skeleton } from "@/components/ui/skeleton";

import type { OwnerMapLocation } from "./contact-globe";
import ContactGlobeLazy from "./contact-globe-lazy";

interface ContactIllustrationProps {
  location: OwnerMapLocation | null;
  timezone?: string | null;
}

const ContactIllustration: FC<ContactIllustrationProps> = ({
  location,
  timezone,
}) => {
  if (!location) return null;

  return (
    <div className="relative mt-2 flex h-72 w-full flex-col sm:h-80 lg:h-96">
      <ViewportSection
        fallback={<Skeleton className="h-full w-full rounded-[2rem]" />}
        minHeight="18rem"
        className="h-full"
      >
        <ContactGlobeLazy location={location} timezone={timezone} />
      </ViewportSection>
    </div>
  );
};

export default ContactIllustration;
