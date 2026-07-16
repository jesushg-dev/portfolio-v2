"use client";

import dynamic from "next/dynamic";

const ScrollToTop = dynamic(
  () => import("@/components/custom-ui/scroll-to-top"),
  {
    ssr: false,
  },
);

export default function ScrollToTopLazy() {
  return <ScrollToTop />;
}
