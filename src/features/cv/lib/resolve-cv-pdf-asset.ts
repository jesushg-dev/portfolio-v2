import "server-only";

import { UTApi } from "uploadthing/server";

import type { Locale } from "@/i18n/config";
import { computeCvPdfContentHash } from "@/features/cv/lib/compute-cv-pdf-content-hash";
import { requestCvPdfGeneration } from "@/features/cv/lib/request-cv-pdf-generation";
import { loadCvPreviewSnapshot } from "@/features/cv/lib/load-cv-preview-snapshot";
import { uploadBufferToUploadThing } from "@/lib/uploadthing/upload-buffer";
import { env } from "@/env";
import { db } from "@/server/db";

function sanitizeFileName(value: string): string {
  return value.replace(/[^\w.-]+/g, "_");
}

export interface ResolveCvPdfAssetOptions {
  paginatePages?: boolean;
  forceRegenerate?: boolean;
  includeBuffer?: boolean;
}

export interface ResolvedCvPdfAsset {
  url: string | null;
  buffer: Buffer | null;
  fileName: string;
  fromCache: boolean;
  contentHash: string;
}

async function fetchPdfBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch cached CV PDF (${response.status})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function deleteStoredPdf(storageKey: string | null | undefined) {
  if (!storageKey || !env.UPLOADTHING_TOKEN) return;

  const utapi = new UTApi({ token: env.UPLOADTHING_TOKEN });
  await utapi.deleteFiles(storageKey).catch(() => undefined);
}

export async function resolveCvPdfAsset(
  userId: string,
  username: string,
  locale: Locale,
  fallbackLocale: Locale,
  options?: ResolveCvPdfAssetOptions,
): Promise<ResolvedCvPdfAsset | null> {
  const paginatePages = options?.paginatePages ?? false;
  const snapshot = await loadCvPreviewSnapshot(
    db,
    userId,
    locale,
    fallbackLocale,
  );

  if (!snapshot?.header) return null;

  const contentHash = computeCvPdfContentHash(snapshot, paginatePages);
  const fileName = `CV-${sanitizeFileName(snapshot.header.fullName)}.pdf`;

  const cached = await db.cvPdfLink.findUnique({
    where: {
      userId_locale_paginatePages: {
        userId,
        locale,
        paginatePages,
      },
    },
  });

  const cacheIsFresh =
    !options?.forceRegenerate &&
    cached?.contentHash === contentHash &&
    Boolean(cached.url);

  if (cacheIsFresh && cached) {
    return {
      url: cached.url,
      buffer: options?.includeBuffer ? await fetchPdfBuffer(cached.url) : null,
      fileName,
      fromCache: true,
      contentHash,
    };
  }

  if (
    !options?.forceRegenerate &&
    cached &&
    !cached.contentHash &&
    cached.url
  ) {
    return {
      url: cached.url,
      buffer: options?.includeBuffer ? await fetchPdfBuffer(cached.url) : null,
      fileName,
      fromCache: true,
      contentHash,
    };
  }

  const buffer = await requestCvPdfGeneration({
    locale,
    tenantUsername: username,
    paginatePages,
  });

  if (!env.UPLOADTHING_TOKEN) {
    return {
      url: null,
      buffer,
      fileName,
      fromCache: false,
      contentHash,
    };
  }

  const uploaded = await uploadBufferToUploadThing(
    buffer,
    fileName,
    "application/pdf",
  );

  await deleteStoredPdf(cached?.storageKey);

  await db.cvPdfLink.upsert({
    where: {
      userId_locale_paginatePages: {
        userId,
        locale,
        paginatePages,
      },
    },
    create: {
      userId,
      locale,
      paginatePages,
      url: uploaded.url,
      contentHash,
      storageKey: uploaded.key,
      generatedAt: new Date(),
    },
    update: {
      url: uploaded.url,
      contentHash,
      storageKey: uploaded.key,
      generatedAt: new Date(),
    },
  });

  return {
    url: uploaded.url,
    buffer: options?.includeBuffer ? buffer : null,
    fileName,
    fromCache: false,
    contentHash,
  };
}
