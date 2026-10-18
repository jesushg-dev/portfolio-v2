import { stackTypes } from "@/utils/constants/certificates-type";

export function resolveCertificateTabIndex(slug?: string[]): number {
  if (slug && slug.length > 0) {
    const slugUpperCase = slug[0].toUpperCase();
    return stackTypes.findIndex((type) => type === slugUpperCase);
  }
  return 0;
}
