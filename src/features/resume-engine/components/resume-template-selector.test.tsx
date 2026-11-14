import { fireEvent, screen, within } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ResumeTemplateSelector } from "./resume-template-selector";

describe("ResumeTemplateSelector", () => {
  it("renders miniature template cards with proper radio roles", () => {
    const onTemplateChange = jest.fn();
    const onLocaleChange = jest.fn();

    renderWithIntl(
      <ResumeTemplateSelector
        templateVersion="v2"
        onTemplateVersionChange={onTemplateChange}
        targetLocale="auto"
        onTargetLocaleChange={onLocaleChange}
        hasStudioData={true}
        studioPreview={{ fullName: "Jesús Hernández", experienceCount: 5 }}
      />,
    );

    const templateGroup = screen.getByRole("radiogroup", {
      name: "CV Template",
    });
    expect(templateGroup).toBeInTheDocument();

    const templateRadios = within(templateGroup).getAllByRole("radio");
    expect(templateRadios).toHaveLength(2);

    // v2 should be selected
    expect(templateRadios[1]).toHaveAttribute("aria-checked", "true");
    expect(templateRadios[0]).toHaveAttribute("aria-checked", "false");
  });

  it("renders miniature layout previews without leaking external images", () => {
    const onTemplateChange = jest.fn();
    const onLocaleChange = jest.fn();

    const { container } = renderWithIntl(
      <ResumeTemplateSelector
        templateVersion="v2"
        onTemplateVersionChange={onTemplateChange}
        targetLocale="auto"
        onTargetLocaleChange={onLocaleChange}
        hasStudioData={true}
      />,
    );

    // Verify no <img> elements are used for template previews
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(0);

    // Verify both template cards exist
    const templateGroup = screen.getByRole("radiogroup", {
      name: "CV Template",
    });
    const radios = within(templateGroup).getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(screen.getByText(/V1/)).toBeInTheDocument();
    expect(screen.getByText(/V2/)).toBeInTheDocument();
  });

  it("calls onTemplateVersionChange when clicking a template card", () => {
    const onTemplateChange = jest.fn();
    const onLocaleChange = jest.fn();

    renderWithIntl(
      <ResumeTemplateSelector
        templateVersion="v2"
        onTemplateVersionChange={onTemplateChange}
        targetLocale="auto"
        onTargetLocaleChange={onLocaleChange}
        hasStudioData={true}
      />,
    );

    const templateGroup = screen.getByRole("radiogroup", {
      name: "CV Template",
    });
    const templateRadios = within(templateGroup).getAllByRole("radio");
    fireEvent.click(templateRadios[0]); // Click v1

    expect(onTemplateChange).toHaveBeenCalledWith("v1");
  });

  it("navigates template options via keyboard arrow keys", () => {
    const onTemplateChange = jest.fn();
    const onLocaleChange = jest.fn();

    renderWithIntl(
      <ResumeTemplateSelector
        templateVersion="v1"
        onTemplateVersionChange={onTemplateChange}
        targetLocale="auto"
        onTargetLocaleChange={onLocaleChange}
        hasStudioData={true}
      />,
    );

    const templateGroup = screen.getByRole("radiogroup", {
      name: "CV Template",
    });
    const templateRadios = within(templateGroup).getAllByRole("radio");
    fireEvent.keyDown(templateRadios[0], { key: "ArrowRight" });

    expect(onTemplateChange).toHaveBeenCalledWith("v2");
  });

  it("renders 4 language option cards and changes selection on click", () => {
    const onTemplateChange = jest.fn();
    const onLocaleChange = jest.fn();

    renderWithIntl(
      <ResumeTemplateSelector
        templateVersion="v2"
        onTemplateVersionChange={onTemplateChange}
        targetLocale="auto"
        onTargetLocaleChange={onLocaleChange}
        hasStudioData={true}
      />,
    );

    const languageGroup = screen.getByRole("radiogroup", {
      name: "Output language",
    });
    expect(languageGroup).toBeInTheDocument();

    const langRadios = within(languageGroup).getAllByRole("radio");
    expect(langRadios).toHaveLength(4);

    // Auto is selected initially
    expect(langRadios[0]).toHaveAttribute("aria-checked", "true");
    expect(langRadios[1]).toHaveAttribute("aria-checked", "false");

    // Click Spanish
    fireEvent.click(langRadios[2]);
    expect(onLocaleChange).toHaveBeenCalledWith("es");
  });

  it("navigates language options via keyboard arrow keys", () => {
    const onTemplateChange = jest.fn();
    const onLocaleChange = jest.fn();

    renderWithIntl(
      <ResumeTemplateSelector
        templateVersion="v2"
        onTemplateVersionChange={onTemplateChange}
        targetLocale="auto"
        onTargetLocaleChange={onLocaleChange}
        hasStudioData={true}
      />,
    );

    const languageGroup = screen.getByRole("radiogroup", {
      name: "Output language",
    });
    const langRadios = within(languageGroup).getAllByRole("radio");

    fireEvent.keyDown(langRadios[0], { key: "ArrowRight" });
    expect(onLocaleChange).toHaveBeenCalledWith("en");
  });
});
