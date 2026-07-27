import "server-only";

import { z } from "zod";

import type { Locale } from "@/i18n/config";
import { env } from "@/env";
import { getInternalServiceBaseUrl } from "@/lib/url/get-base-url";

const requestSchema = z.object({
  locale: z.enum(["en", "es", "nl"]),
  tenantUsername: z.string().optional(),
  baseUrl: z.string().url().optional(),
  paginatePages: z.boolean().optional(),
});

export interface CvPdfGenerationRequest {
  locale: Locale;
  tenantUsername?: string;
  baseUrl?: string;
  paginatePages?: boolean;
}

export async function requestCvPdfGeneration(
  options: CvPdfGenerationRequest,
): Promise<Buffer> {
  const secret = env.CV_PDF_GENERATOR_SECRET;
  if (!secret) {
    throw new Error(
      "CV_PDF_GENERATOR_SECRET is not configured. Set it in your environment to enable PDF generation.",
    );
  }

  const payload = requestSchema.parse({
    locale: options.locale,
    tenantUsername: options.tenantUsername,
    baseUrl: options.baseUrl,
    paginatePages: options.paginatePages,
  });

  const response = await fetch(
    `${getInternalServiceBaseUrl()}/api/internal/cv/generate-pdf`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `CV PDF generator failed (${response.status})${details ? `: ${details}` : ""}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}
