const DEFAULT_CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

export function getChromiumPackUrl(): string {
  return process.env.CHROMIUM_PACK_URL ?? DEFAULT_CHROMIUM_PACK_URL;
}
