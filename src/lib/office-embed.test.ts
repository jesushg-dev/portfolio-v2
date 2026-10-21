import { buildOfficeEmbedUrl } from "./office-embed";

describe("buildOfficeEmbedUrl", () => {
  it("encodes a public HTTPS file URL for the Office viewer", () => {
    const fileUrl =
      "https://0x95s0sprv.ufs.sh/f/Vb5mrbpUjmSx0wVd9NwsC45zO1YAMSbheR7iFQtTa9qEWfXu";
    expect(buildOfficeEmbedUrl(fileUrl)).toBe(
      `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`,
    );
  });

  it("strips an explicit :443 port", () => {
    const embedUrl = buildOfficeEmbedUrl(
      "https://0x95s0sprv.ufs.sh:443/f/example",
    );
    expect(embedUrl).toContain(
      encodeURIComponent("https://0x95s0sprv.ufs.sh/f/example"),
    );
    expect(embedUrl).not.toContain("443");
  });

  it("rejects non-HTTPS and invalid URLs", () => {
    expect(buildOfficeEmbedUrl("http://example.com/cv.docx")).toBeNull();
    expect(buildOfficeEmbedUrl("not-a-url")).toBeNull();
  });

  it("does not embed PDFs in the Office viewer", () => {
    const fileUrl = "https://0x95s0sprv.ufs.sh/f/example.pdf";
    expect(buildOfficeEmbedUrl(fileUrl)).toBeNull();
  });
});
