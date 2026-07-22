import { NextResponse } from "next/server";

import { locales, type Locale } from "@/i18n/config";
import { getCvPdfDownloadBuffer } from "@/features/cv/lib/get-cv-pdf-download";
import { resolveTenant } from "@/lib/tenant/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isLocale(value: string | null): value is Locale {
  return value !== null && (locales as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const tenant = await resolveTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale");
  const locale: Locale = isLocale(localeParam)
    ? localeParam
    : tenant.defaultLocale;
  const paginatePages = searchParams.get("paginate") === "1";

  try {
    const result = await getCvPdfDownloadBuffer(
      tenant.userId,
      tenant.username,
      locale,
      tenant.defaultLocale,
      { paginatePages },
    );

    if (!result) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[cv/pdf] generation failed", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
