import {
  isDocxUpload,
  isPdfResumeFile,
  isPdfUpload,
} from "./parse-pdf-for-import";

describe("resume upload type helpers", () => {
  it("detects PDF by mime or extension", () => {
    expect(isPdfUpload("cv.pdf", "application/pdf")).toBe(true);
    expect(isPdfUpload("cv.PDF", "application/octet-stream")).toBe(true);
    expect(isPdfUpload("cv.docx", "application/pdf")).toBe(true);
  });

  it("detects a tailored PDF even without .pdf in the URL", () => {
    expect(
      isPdfResumeFile({
        url: "https://utfs.io/f/abc123",
        fileName: "Jesus Hernandez - Fullstack Developer - ES.pdf",
        mimeType: "application/pdf",
      }),
    ).toBe(true);
    expect(
      isPdfResumeFile({
        url: "https://utfs.io/f/abc123",
        fileName: "cv.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).toBe(false);
  });

  it("detects DOCX uploads", () => {
    expect(
      isDocxUpload(
        "cv.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe(true);
    expect(isDocxUpload("cv.pdf", "application/pdf")).toBe(false);
  });
});

describe("resume upload type helpers", () => {
  it("detects PDF by mime or extension", () => {
    expect(isPdfUpload("cv.pdf", "application/pdf")).toBe(true);
    expect(isPdfUpload("cv.PDF", "application/octet-stream")).toBe(true);
    expect(isPdfUpload("cv.docx", "application/pdf")).toBe(true);
  });

  it("detects DOCX uploads", () => {
    expect(
      isDocxUpload(
        "cv.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe(true);
    expect(isDocxUpload("cv.pdf", "application/pdf")).toBe(false);
  });
});
