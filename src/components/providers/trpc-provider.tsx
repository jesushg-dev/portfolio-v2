"use client";

import type { ReactNode } from "react";

import { TRPCReactProvider } from "@/trpc/react";

interface TrpcProviderProps {
  children: ReactNode;
}

/** Eager tRPC + React Query — mount in layouts that render client tRPC hooks on load. */
export default function TrpcProvider({ children }: TrpcProviderProps) {
  return <TRPCReactProvider>{children}</TRPCReactProvider>;
}
