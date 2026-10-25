import { render, screen, fireEvent } from "@testing-library/react";
import {
  AdminFormLanguageBar,
  ReferenceSnippet,
  AdminFormEmptyTranslation,
  AdminFormDeleteTranslation,
  type LanguageProgress,
} from "./admin-form-language-bar";

describe("AdminFormLanguageBar", () => {
  const sampleLanguages: LanguageProgress[] = [
    {
      id: "l1",
      code: "en",
      name: "English",
      isBase: true,
      hasContent: true,
      completedCount: 2,
      totalCount: 2,
    },
    {
      id: "l2",
      code: "es",
      name: "Español",
      hasContent: true,
      completedCount: 1,
      totalCount: 2,
    },
    {
      id: "l3",
      code: "nl",
      name: "Nederlands",
      hasContent: false,
      completedCount: 0,
      totalCount: 2,
    },
  ];

  it("renders language cards with active state and progress", () => {
    const handleSelect = jest.fn();
    render(
      <AdminFormLanguageBar
        languages={sampleLanguages}
        activeLangId="l1"
        onSelectLang={handleSelect}
        missingItems={[]}
      />,
    );

    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Base")).toBeInTheDocument();
    expect(screen.getByText("2/2 complete")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(screen.getByText("1/2 complete")).toBeInTheDocument();
    expect(
      screen.getByText("Not translated in Nederlands"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Español"));
    expect(handleSelect).toHaveBeenCalledWith("l2");
  });

  it("renders missing items when provided", () => {
    render(
      <AdminFormLanguageBar
        languages={sampleLanguages}
        activeLangId="l2"
        onSelectLang={jest.fn()}
        missingItems={["description"]}
      />,
    );

    expect(screen.getByText("Missing: description")).toBeInTheDocument();
  });

  it("handles reference toggle when isNonPrimary is true", () => {
    const handleToggle = jest.fn();
    render(
      <AdminFormLanguageBar
        languages={sampleLanguages}
        activeLangId="l2"
        onSelectLang={jest.fn()}
        isNonPrimary={true}
        showOriginal={true}
        onToggleShowOriginal={handleToggle}
      />,
    );

    const switchBtn = screen.getByRole("switch");
    expect(switchBtn).toBeInTheDocument();
    fireEvent.click(switchBtn);
    expect(handleToggle).toHaveBeenCalled();
  });
});

describe("ReferenceSnippet", () => {
  it("renders label, content, and calls onCopy", () => {
    const handleCopy = jest.fn();
    render(
      <ReferenceSnippet
        label="EN"
        content="Base title content"
        onCopy={handleCopy}
        copyText="Copy"
      />,
    );

    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("Base title content")).toBeInTheDocument();

    const copyBtn = screen.getByText("Copy");
    fireEvent.click(copyBtn);
    expect(handleCopy).toHaveBeenCalled();
  });

  it("returns null if content is empty", () => {
    const { container } = render(
      <ReferenceSnippet label="EN" content="" onCopy={jest.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("AdminFormEmptyTranslation", () => {
  it("renders empty state with action buttons", () => {
    const handleCopy = jest.fn();
    const handleStartBlank = jest.fn();

    render(
      <AdminFormEmptyTranslation
        languageName="Español"
        baseLanguageName="English"
        onCopyFromBase={handleCopy}
        onStartBlank={handleStartBlank}
      />,
    );

    expect(screen.getByText("Not translated in Español")).toBeInTheDocument();
    expect(screen.getByText("Copy from English")).toBeInTheDocument();
    expect(screen.getByText("Start blank")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Copy from English"));
    expect(handleCopy).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Start blank"));
    expect(handleStartBlank).toHaveBeenCalled();
  });
});

describe("AdminFormDeleteTranslation", () => {
  it("confirms before deleting translation", () => {
    const handleDelete = jest.fn();
    render(
      <AdminFormDeleteTranslation
        languageName="Español"
        onDelete={handleDelete}
      />,
    );

    const deleteBtn = screen.getByText("Delete translation in Español");
    fireEvent.click(deleteBtn);

    expect(
      screen.getByText("Delete translation in Español?"),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmBtn);
    expect(handleDelete).toHaveBeenCalled();
  });
});
