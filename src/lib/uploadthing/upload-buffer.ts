import "server-only";

import {
  requireTenantUploadThingClient,
  type TenantUploadThingClient,
} from "@/lib/uploadthing/tenant-uploadthing";

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

/** Uploads a buffer using the tenant's UploadThing integration (no .env fallback). */
export async function uploadBufferToUploadThing(
  userId: string,
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  client?: TenantUploadThingClient,
): Promise<{ url: string; key: string }> {
  const { utapi } = client ?? (await requireTenantUploadThingClient(userId));
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
