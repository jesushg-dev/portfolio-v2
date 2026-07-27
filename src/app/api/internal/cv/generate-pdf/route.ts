import { NextResponse } from "next/server";
import { z } from "zod";

import { generateCvPdfFromPreview } from "@/features/cv/lib/generate-cv-pdf-from-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const requestSchema = z.object({
  locale: z.enum(["en", "es", "nl"]),
  tenantUsername: z.string().optional(),
  baseUrl: z.string().url().optional(),
  paginatePages: z.boolean().optional(),
});

function isAuthorized(request: Request): boolean {
  const secret = process.env.CV_PDF_GENERATOR_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = requestSchema.parse(await request.json());
    const buffer = await generateCvPdfFromPreview(body);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[internal/cv/generate-pdf] failed", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
