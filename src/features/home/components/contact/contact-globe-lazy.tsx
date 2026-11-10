"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { OwnerMapLocation } from "./contact-globe";

const ContactGlobe = dynamic(
  () => import("./contact-globe").then((module) => module.ContactGlobe),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-2xl" />,
  },
);

export default function ContactGlobeLazy({
  location,
  timezone,
}: {
  location: OwnerMapLocation;
  timezone?: string | null;
}) {
  return <ContactGlobe location={location} timezone={timezone} />;
}
