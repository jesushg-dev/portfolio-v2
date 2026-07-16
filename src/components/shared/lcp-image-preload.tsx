interface LcpImagePreloadProps {
  href: string;
}

/** Hoisted to `<head>` by Next.js — must match the hero `<Image>` src exactly. */
export default function LcpImagePreload({ href }: LcpImagePreloadProps) {
  return <link rel="preload" as="image" href={href} fetchPriority="high" />;
}
