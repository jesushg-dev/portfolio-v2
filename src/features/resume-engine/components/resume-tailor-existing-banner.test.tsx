import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ResumeTailorExistingBanner } from "./resume-tailor-existing-banner";

describe("ResumeTailorExistingBanner", () => {
  it("renders existing cv info and children", () => {
    renderWithIntl(
      <ResumeTailorExistingBanner
        existingCvFile={{
          name: "resume.pdf",
          url: "https://example.com/resume.pdf",
          uploadedAt: new Date("2026-01-15T12:00:00Z"),
        }}
      >
        <div data-testid="child-preview">Preview Panel</div>
      </ResumeTailorExistingBanner>,
    );

    expect(screen.getByTestId("child-preview")).toBeInTheDocument();
  });
});
