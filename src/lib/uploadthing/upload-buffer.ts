import "server-only";

import { UTApi } from "uploadthing/server";

import { env } from "@/env";

interface UploadThingFileData {
  url: string;
  ufsUrl?: string | null;
  key: string;
}

interface UploadThingSuccess {
  data: UploadThingFileData;
  error: null;
}

interface UploadThingFailure {
  data: null;
  error: { message: string };
}

type UploadThingFileResponse = UploadThingSuccess | UploadThingFailure;

function isUploadThingFailure(
  response: UploadThingFileResponse,
): response is UploadThingFailure {
  return response.error !== null;
}

function normalizeUploadResponse(
  response: UploadThingFileResponse | UploadThingFileResponse[],
): UploadThingFileData {
  const item = Array.isArray(response) ? response[0] : response;
  if (!item || isUploadThingFailure(item)) {
    throw new Error(item?.error.message ?? "Upload failed");
  }
  return item.data;
}

export async function uploadBufferToUploadThing(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<{ url: string; key: string }> {
  if (!env.UPLOADTHING_TOKEN) {
    throw new Error("UPLOADTHING_TOKEN is not configured.");
  }

  const utapi = new UTApi({ token: env.UPLOADTHING_TOKEN });
  const bytes = new Uint8Array(buffer);
  const file = new File([bytes], fileName, { type: mimeType });
  const response = (await utapi.uploadFiles(file)) as
    UploadThingFileResponse | UploadThingFileResponse[];

  const data = normalizeUploadResponse(response);

  return {
    url: data.ufsUrl ?? data.url,
    key: data.key,
  };
}
