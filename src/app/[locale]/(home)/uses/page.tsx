import { notFound } from "next/navigation";

export { generateMetadata } from "./metadata";

export default function UsesPage(): never {
  notFound();
}
