import "server-only";

import crypto from "node:crypto";

export interface ILovePdfApiKeys {
  publicKey: string;
  secretKey: string;
}

export interface ILovePdfStartResponse {
  server: string;
  task: string;
  remaining_files?: number;
}

export interface ILovePdfUploadResponse {
  server_filename: string;
}

export interface ILovePdfProcessResponse {
  download_filename: string;
  filesize: number;
  output_filesize: number;
  output_filenumber: number;
  output_extensions: string[];
  status: string;
}

function base64UrlEncode(data: string | Buffer): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Generates an HS256 JSON Web Token signed with the iLovePDF secret key.
 * Contains `iss: "api.ilovepdf.com"`, `jti: publicKey`, and `iat: now - 5`.
 */
export function generateILovePdfToken(
  publicKey: string,
  secretKey: string,
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "api.ilovepdf.com",
    jti: publicKey,
    iat: now - 5,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(dataToSign)
    .digest();

  const encodedSignature = base64UrlEncode(signature);
  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Tests connection to iLovePDF by initiating an authentication task check.
 */
export async function testILovePdfConnection(
  publicKey: string,
  secretKey: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = generateILovePdfToken(publicKey, secretKey);
    const response = await fetch("https://api.ilovepdf.com/v1/start/officepdf", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorJson = (await response.json().catch(() => null)) as {
        name?: string;
        message?: string;
        error?: { message?: string };
      } | null;
      return {
        success: false,
        error:
          errorJson?.message ??
          errorJson?.error?.message ??
          `iLovePDF API returned status ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Network error connecting to iLovePDF",
    };
  }
}

/**
 * Starts a task with iLovePDF for the specified tool.
 */
async function startTask(
  tool: "officepdf" | "htmlpdf",
  token: string,
): Promise<ILovePdfStartResponse> {
  const response = await fetch(`https://api.ilovepdf.com/v1/start/${tool}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to start iLovePDF ${tool} task (${response.status}): ${errorText}`,
    );
  }

  return (await response.json()) as ILovePdfStartResponse;
}

/**
 * Uploads a binary file to the assigned task server.
 */
async function uploadFile(
  server: string,
  task: string,
  token: string,
  fileBuffer: Buffer,
  fileName: string,
): Promise<ILovePdfUploadResponse> {
  const formData = new FormData();
  formData.append("task", task);
  const blob = new Blob([new Uint8Array(fileBuffer)]);
  formData.append("file", blob, fileName);

  const response = await fetch(`https://${server}/v1/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to upload file to iLovePDF (${response.status}): ${errorText}`,
    );
  }

  return (await response.json()) as ILovePdfUploadResponse;
}

/**
 * Uploads a remote cloud URL to the assigned task server for HTML-to-PDF conversion.
 */
async function uploadCloudUrl(
  server: string,
  task: string,
  token: string,
  url: string,
): Promise<ILovePdfUploadResponse> {
  const formData = new FormData();
  formData.append("task", task);
  formData.append("cloud_file", url);

  const response = await fetch(`https://${server}/v1/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to upload URL to iLovePDF (${response.status}): ${errorText}`,
    );
  }

  return (await response.json()) as ILovePdfUploadResponse;
}

/**
 * Processes an iLovePDF task.
 */
async function processTask(
  server: string,
  task: string,
  tool: "officepdf" | "htmlpdf",
  token: string,
  serverFilename: string,
  originalFilename: string,
  extraParams?: Record<string, unknown>,
): Promise<ILovePdfProcessResponse> {
  const payload = {
    task,
    tool,
    files: [
      {
        server_filename: serverFilename,
        filename: originalFilename,
      },
    ],
    ...extraParams,
  };

  const response = await fetch(`https://${server}/v1/process`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to process iLovePDF ${tool} task (${response.status}): ${errorText}`,
    );
  }

  return (await response.json()) as ILovePdfProcessResponse;
}

/**
 * Downloads the resulting PDF buffer from the processed task.
 */
async function downloadResult(
  server: string,
  task: string,
  token: string,
): Promise<Buffer> {
  const response = await fetch(`https://${server}/v1/download/${task}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to download iLovePDF result (${response.status}): ${errorText}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Converts a Microsoft Word DOCX buffer into a high-fidelity PDF buffer.
 */
export async function convertOfficeToPdf(
  docxBuffer: Buffer,
  keys: ILovePdfApiKeys,
  fileName = "document.docx",
): Promise<Buffer> {
  const token = generateILovePdfToken(keys.publicKey, keys.secretKey);
  const start = await startTask("officepdf", token);
  const upload = await uploadFile(
    start.server,
    start.task,
    token,
    docxBuffer,
    fileName,
  );
  await processTask(
    start.server,
    start.task,
    "officepdf",
    token,
    upload.server_filename,
    fileName,
  );
  return downloadResult(start.server, start.task, token);
}

export interface ConvertHtmlToPdfOptions {
  keys: ILovePdfApiKeys;
  url?: string;
  html?: string;
  singlePage?: boolean;
  pageOrientation?: "portrait" | "landscape";
}

/**
 * Converts a webpage URL or HTML string into a PDF buffer.
 */
export async function convertHtmlToPdf(
  options: ConvertHtmlToPdfOptions,
): Promise<Buffer> {
  const token = generateILovePdfToken(
    options.keys.publicKey,
    options.keys.secretKey,
  );
  const start = await startTask("htmlpdf", token);

  let upload: ILovePdfUploadResponse;
  let filename = "webpage.html";

  if (options.url) {
    upload = await uploadCloudUrl(start.server, start.task, token, options.url);
  } else if (options.html) {
    filename = "document.html";
    upload = await uploadFile(
      start.server,
      start.task,
      token,
      Buffer.from(options.html, "utf-8"),
      filename,
    );
  } else {
    throw new Error("Either url or html must be provided to convertHtmlToPdf");
  }

  const extraParams: Record<string, unknown> = {};
  if (options.singlePage !== undefined) {
    extraParams.single_page = options.singlePage;
  }
  if (options.pageOrientation) {
    extraParams.page_orientation = options.pageOrientation;
  }

  await processTask(
    start.server,
    start.task,
    "htmlpdf",
    token,
    upload.server_filename,
    filename,
    extraParams,
  );

  return downloadResult(start.server, start.task, token);
}
