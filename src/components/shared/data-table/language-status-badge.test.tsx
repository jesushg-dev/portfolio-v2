import { render, screen } from "@testing-library/react";
import {
  LanguageStatusBadge,
  computeTranslationStatus,
  type LanguageStatusItem,
} from "./language-status-badge";

describe("LanguageStatusBadge", () => {
  const sampleLanguages: LanguageStatusItem[] = [
    { code: "en", name: "English", status: "complete" },
    { code: "es", name: "Español", status: "incomplete" },
    { code: "nl", name: "Nederlands", status: "missing" },
  ];

  it("renders language codes and accessible titles", () => {
    render(<LanguageStatusBadge languages={sampleLanguages} />);

    expect(screen.getByText("en")).toBeInTheDocument();
    expect(screen.getByText("es")).toBeInTheDocument();
    expect(screen.getByText("nl")).toBeInTheDocument();

    expect(screen.getByTitle("English · Complete")).toBeInTheDocument();
    expect(screen.getByTitle("Español · Incomplete")).toBeInTheDocument();
    expect(screen.getByTitle("Nederlands · Missing")).toBeInTheDocument();
  });

  it("returns null if languages array is empty", () => {
    const { container } = render(<LanguageStatusBadge languages={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("computeTranslationStatus", () => {
  it("returns missing when translation is null or undefined", () => {
    expect(computeTranslationStatus(null, ["title"])).toBe("missing");
    expect(computeTranslationStatus(undefined, ["title"])).toBe("missing");
  });

  it("returns complete when all required fields are populated", () => {
    expect(
      computeTranslationStatus(
        { title: "Senior Engineer", description: "Led teams" },
        ["title", "description"],
      ),
    ).toBe("complete");
  });

  it("returns incomplete when some fields are populated but others are missing", () => {
    expect(
      computeTranslationStatus({ title: "Senior Engineer", description: "" }, [
        "title",
        "description",
      ]),
    ).toBe("incomplete");
  });

  it("returns missing when all required fields are empty", () => {
    expect(
      computeTranslationStatus({ title: "", description: "" }, [
        "title",
        "description",
      ]),
    ).toBe("missing");
  });
});
