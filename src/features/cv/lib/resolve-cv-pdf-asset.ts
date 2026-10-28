import "server-only";

import type { Locale } from "@/i18n/config";
import { computeCvPdfContentHash } from "@/features/cv/lib/compute-cv-pdf-content-hash";
import { loadCvPreviewSnapshot } from "@/features/cv/lib/load-cv-preview-snapshot";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import { generateDocxFromStructured } from "@/features/resume-engine/lib/docx/generate-from-structured";
import { generateCvDocxFromDb } from "@/features/cv/lib/generate-cv-docx-from-db";
import { convertDocxToPdfForTenant } from "@/lib/ilovepdf/tenant-ilovepdf";
import { uploadBufferToUploadThing } from "@/lib/uploadthing/upload-buffer";
import {
  getTenantUploadThingClient,
  isTenantUploadThingConfigured,
} from "@/lib/uploadthing/tenant-uploadthing";
import {
  buildAtsCvFileName,
  inferCvRoleTrack,
} from "@/lib/cv/build-ats-cv-file-name";
import { db } from "@/server/db";

export interface ResolveCvPdfAssetOptions {
  paginatePages?: boolean;
  forceRegenerate?: boolean;
  includeBuffer?: boolean;
  design?: string;
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

async function deleteStoredPdf(
  userId: string,
  storageKey: string | null | undefined,
) {
  if (!storageKey) return;

  const client = await getTenantUploadThingClient(userId);
  if (!client) return;

  await client.utapi.deleteFiles(storageKey).catch(() => undefined);
}

export async function resolveCvPdfAsset(
  userId: string,
  username: string,
  locale: Locale,
  fallbackLocale: Locale,
  options?: ResolveCvPdfAssetOptions,
): Promise<ResolvedCvPdfAsset | null> {
  const paginatePages = options?.paginatePages ?? false;
  const design = options?.design;
  const isAts = design === "ats";
  const isDefaultDesign = !design || design === "default";
  const snapshot = await loadCvPreviewSnapshot(db, userId, locale);

  if (!snapshot?.header) return null;

  const contentHash = computeCvPdfContentHash(snapshot, paginatePages, design);
  const fileName = buildAtsCvFileName({
    fullName: snapshot.header.fullName,
    roleTrack: inferCvRoleTrack(snapshot.header.degree || ""),
    locale,
    extension: "pdf",
  });

  const cached = isDefaultDesign
    ? await db.cvPdfLink.findUnique({
        where: {
          userId_locale_paginatePages: {
            userId,
            locale,
            paginatePages,
          },
        },
      })
    : null;

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

  let docxBuffer: Buffer | null = null;
  if (!isAts) {
    try {
      const styledDocx = await generateCvDocxFromDb(
        db,
        userId,
        locale,
        fallbackLocale,
      );
      if (styledDocx?.buffer) {
        docxBuffer = styledDocx.buffer;
      }
    } catch (err) {
      console.error(
        "[resolveCvPdfAsset] styled docx generation failed, falling back to structured docx",
        err,
      );
    }
  }

  if (!docxBuffer) {
    const draft = await loadCvStructuredDraft(db, userId, {
      locale,
      fallbackLocale,
    });
    if (!draft) return null;
    docxBuffer = await generateDocxFromStructured(draft);
  }

  const buffer = await convertDocxToPdfForTenant(
    userId,
    docxBuffer,
    fileName.replace(/\.pdf$/i, ".docx"),
  );

  if (!isDefaultDesign || !(await isTenantUploadThingConfigured(userId))) {
    return {
      url: null,
      buffer,
      fileName,
      fromCache: false,
      contentHash,
    };
  }

  const storageClient = await getTenantUploadThingClient(userId);
  if (!storageClient) {
    return {
      url: null,
      buffer,
      fileName,
      fromCache: false,
      contentHash,
    };
  }

  const uploaded = await uploadBufferToUploadThing(
    userId,
    buffer,
    fileName,
    "application/pdf",
    storageClient,
  );

  await deleteStoredPdf(userId, cached?.storageKey);

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
