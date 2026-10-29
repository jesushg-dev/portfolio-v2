import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateMetadata(): Promise<Metadata> {
  notFound();
}
