import { createNavigation } from "next-intl/navigation";

export { routing, localePrefix } from "@/i18n/routing-config";
import { routing } from "@/i18n/routing-config";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
