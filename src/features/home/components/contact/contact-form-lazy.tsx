"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

const ContactForm = dynamic(() => import("./contact-form"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-28" />
    </div>
  ),
});

export default ContactForm;
