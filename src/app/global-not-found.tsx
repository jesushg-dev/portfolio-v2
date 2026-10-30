import Link from "next/link";
import "./globals.css";

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="bg-background text-foreground grid min-h-screen place-content-center gap-4 p-8">
        <h1 className="text-3xl font-bold">404</h1>
        <p>This page could not be found.</p>
        <Link href="/" className="underline">
          Return home
        </Link>
      </body>
    </html>
  );
}
