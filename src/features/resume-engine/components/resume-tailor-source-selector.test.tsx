import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ResumeTailorSourceSelector } from "./resume-tailor-source-selector";

jest.mock("@/features/resume-engine/components/resume-docx-upload", () => ({
  ResumeDocxUpload: () => <div data-testid="resume-docx-upload" />,
}));

describe("ResumeTailorSourceSelector", () => {
  it("renders both studio and upload choices", () => {
    const onSourceTypeChange = jest.fn();

    renderWithIntl(
      <ResumeTailorSourceSelector
        sourceType="studio"
        onSourceTypeChange={onSourceTypeChange}
        hasStudioData={true}
        studioPreview={{ fullName: "John Doe", experienceCount: 3 }}
        uploads={[]}
        uploadId={null}
        onUploadIdChange={jest.fn()}
        onUploadComplete={jest.fn()}
        onError={jest.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /resume studio/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upload docx/i }),
    ).toBeInTheDocument();
  });

  it("calls onSourceTypeChange when upload option is clicked", () => {
    const onSourceTypeChange = jest.fn();

    renderWithIntl(
      <ResumeTailorSourceSelector
        sourceType="studio"
        onSourceTypeChange={onSourceTypeChange}
        hasStudioData={true}
        uploads={[]}
        uploadId={null}
        onUploadIdChange={jest.fn()}
        onUploadComplete={jest.fn()}
        onError={jest.fn()}
      />,
    );

    const uploadBtn = screen.getByText(/upload/i).closest("button")!;
    fireEvent.click(uploadBtn);
    expect(onSourceTypeChange).toHaveBeenCalledWith("upload");
  });

  it("shows upload list and dropzone when sourceType is upload", () => {
    const onUploadIdChange = jest.fn();

    renderWithIntl(
      <ResumeTailorSourceSelector
        sourceType="upload"
        onSourceTypeChange={jest.fn()}
        hasStudioData={false}
        uploads={[{ id: "up-1", fileName: "resume.docx" }]}
        uploadId={null}
        onUploadIdChange={onUploadIdChange}
        onUploadComplete={jest.fn()}
        onError={jest.fn()}
      />,
    );

    expect(screen.getByText("resume.docx")).toBeInTheDocument();
    expect(screen.getByTestId("resume-docx-upload")).toBeInTheDocument();

    fireEvent.click(screen.getByText("resume.docx"));
    expect(onUploadIdChange).toHaveBeenCalledWith("up-1");
  });
});
