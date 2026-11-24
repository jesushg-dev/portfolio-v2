/**
 * Triggers a client-side file download cleanly in an isolated utility,
 * avoiding direct imperative DOM mutations inside React components.
 */
export function downloadUrl(fileName: string, url: string): void {
  if (typeof document === "undefined") return;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  downloadUrl(fileName, url);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
