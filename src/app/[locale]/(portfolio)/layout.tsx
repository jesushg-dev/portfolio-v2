import { type ReactNode } from "react";
import "@/app/globals.css";

import { headers } from "next/headers";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import Layout from "@/components/app-layout";
import TrpcProvider from "@/components/providers/trpc-provider";
import { CV_PDF_MODE_HEADER } from "@/lib/tenant/headers";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const isPdfMode = (await headers()).get(CV_PDF_MODE_HEADER) === "1";

  if (isPdfMode) {
    return children;
  }

  return (
    <TrpcProvider>
      <NuqsAdapter>
        <Layout>{children}</Layout>
      </NuqsAdapter>
    </TrpcProvider>
  );
}
