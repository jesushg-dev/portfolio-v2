import { classifyPolishedResumeFile } from "./classify-polished-resume";

describe("classifyPolishedResumeFile", () => {
  it("treats PDF uploads as style-accurate Word exports", () => {
    expect(classifyPolishedResumeFile("cv.pdf", "application/pdf")).toBe("pdf");
  });

  it("treats DOCX uploads as the canonical resume file", () => {
    expect(
      classifyPolishedResumeFile(
        "cv.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("docx");
  });
});
