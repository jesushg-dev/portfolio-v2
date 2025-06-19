import { Locale } from "next-intl";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return (
    <html lang={locale}>
      <body id="outstatic">{children}</body>
    </html>
  )
}