import sharp from "sharp";
import type { TailoredResumeDocument } from "../tailored-resume-document";

export async function createCompanyMonogram(company: string) {
  const initials = company
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => /\p{L}/u.exec(word)?.[0] ?? "")
    .join("")
    .toUpperCase();
  const data = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect x="6" y="6" width="588" height="588" rx="48" fill="white" stroke="#DEE5EF" stroke-width="12"/><text x="300" y="310" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-weight="600" font-size="220" fill="#103F76">${initials}</text></svg>`,
    ),
  )
    .png()
    .toBuffer();
  return { data, extension: "png" as const };
}

/** Public image hosts used by the CMS; reject redirects and bound decoded size. */
export async function loadResumePhoto(
  url?: string,
  kind: "photo" | "logo" = "photo",
): Promise<{ data: Buffer; extension: "png" } | undefined> {
  if (!url) return undefined;
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    (!/(^|\.)(utfs\.io|ufs\.sh|uploadthing\.com)$/.test(parsed.hostname) &&
      parsed.hostname !== "res.cloudinary.com")
  ) {
    throw new Error(
      "header.photoUrl: expected an HTTPS UploadThing or Cloudinary image",
    );
  }
  const response = await fetch(parsed, {
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok || !response.body)
    throw new Error("header.photoUrl: could not load the CMS photo");
  const chunks: Uint8Array[] = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > 8 * 1024 * 1024)
      throw new Error("header.photoUrl: image exceeds 8 MB");
    chunks.push(chunk);
  }
  const data = await sharp(Buffer.concat(chunks), {
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      width: 600,
      height: kind === "photo" ? 800 : 600,
      fit: kind === "photo" ? "cover" : "contain",
      background: "white",
    })
    .flatten({ background: "white" })
    .png()
    .toBuffer();
  return { data, extension: "png" };
}

export async function loadResumeImages(
  document: TailoredResumeDocument,
  includeCompanyLogos: boolean,
) {
  const [photo, logos] = await Promise.all([
    loadResumePhoto(document.header.photoUrl),
    Promise.all(
      (includeCompanyLogos ? document.experiences : []).map(
        async (experience) => {
          const logo = await loadResumePhoto(experience.companyLogoUrl, "logo");
          return [experience.id, logo] as const;
        },
      ),
    ),
  ]);
  const companyLogos: Record<string, { data: Buffer; extension: "png" }> = {};
  for (const [id, logo] of logos) if (logo) companyLogos[id] = logo;
  return { photo, companyLogos };
}
