import type { TimelineItem } from "@prisma/client";
import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  mapTimelineToEditorDto,
  mapTimelinesToEditorDto,
  mapTimelineToFormDto,
  buildEmptyTimelineCreateDto,
  getTimelineTranslationText,
} from "./timeline-editor-dto";

const languages: LanguageRef[] = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

const mockTimelineItem: TimelineItem = {
  id: "item-1",
  organization: "Acme Corp",
  location: "New York",
  category: "WORK",
  startDate: new Date("2020-01-01"),
  endDate: new Date("2022-06-30"),
  current: false,
  images: ["https://example.com/img1.jpg"],
  portfolioId: "portfolio-1",
  title: { default: "Engineer", translations: { es: "Ingeniero" } },
  description: { default: "Built stuff", translations: { es: "Construi cosas" } },
  createdAt: new Date("2020-01-01"),
  updatedAt: new Date("2022-06-30"),
};

describe("mapTimelineToEditorDto", () => {
  it("maps a TimelineItem to TimelineEditorDTO", () => {
    const dto = mapTimelineToEditorDto(mockTimelineItem, languages);

    expect(dto.id).toBe("item-1");
    expect(dto.organization).toBe("Acme Corp");
    expect(dto.location).toBe("New York");
    expect(dto.category).toBe("WORK");
    expect(dto.current).toBe(false);
    expect(dto.images).toEqual(["https://example.com/img1.jpg"]);
    expect(dto.translations["lang-en"]?.title).toBe("Engineer");
    expect(dto.translations["lang-es"]?.title).toBe("Ingeniero");
  });

  it("filters non-string image values from images array", () => {
    const item = { ...mockTimelineItem, images: ["valid.jpg", 123, null, "also-valid.jpg"] };
    const dto = mapTimelineToEditorDto(item as unknown as TimelineItem, languages);
    expect(dto.images).toEqual(["valid.jpg", "also-valid.jpg"]);
  });

  it("returns empty images array when images is not an array", () => {
    const item = { ...mockTimelineItem, images: null };
    const dto = mapTimelineToEditorDto(item as unknown as TimelineItem, languages);
    expect(dto.images).toEqual([]);
  });
});

describe("mapTimelinesToEditorDto", () => {
  it("maps multiple items", () => {
    const result = mapTimelinesToEditorDto([mockTimelineItem], languages);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("item-1");
  });

  it("returns empty array for empty input", () => {
    expect(mapTimelinesToEditorDto([], languages)).toEqual([]);
  });
});

describe("mapTimelineToFormDto", () => {
  it("converts editor DTO dates to ISO date strings", () => {
    const editor = mapTimelineToEditorDto(mockTimelineItem, languages);
    const form = mapTimelineToFormDto(editor);

    expect(form.startDate).toBe("2020-01-01");
    expect(form.endDate).toBe("2022-06-30");
    expect(form.location).toBe("New York");
    expect(form.images).toEqual([{ url: "https://example.com/img1.jpg" }]);
  });

  it("returns empty string for null endDate", () => {
    const editor = mapTimelineToEditorDto({ ...mockTimelineItem, endDate: null }, languages);
    const form = mapTimelineToFormDto(editor);
    expect(form.endDate).toBe("");
  });

  it("returns empty images array when there are no images", () => {
    const editor = mapTimelineToEditorDto({ ...mockTimelineItem, images: [] }, languages);
    const form = mapTimelineToFormDto(editor);
    expect(form.images).toEqual([]);
  });

  it("handles string startDate in editor DTO", () => {
    const editor = {
      ...mapTimelineToEditorDto(mockTimelineItem, languages),
      startDate: "2021-05-10" as unknown as Date,
    };
    const form = mapTimelineToFormDto(editor);
    expect(form.startDate).toBe("2021-05-10");
  });

  it("coerces null organization to empty string", () => {
    const editor = mapTimelineToEditorDto(
      { ...mockTimelineItem, organization: null as unknown as string },
      languages,
    );
    const form = mapTimelineToFormDto(editor);
    expect(form.organization).toBe("");
  });

  it("coerces null location to empty string", () => {
    const editor = mapTimelineToEditorDto(
      { ...mockTimelineItem, location: null },
      languages,
    );
    const form = mapTimelineToFormDto(editor);
    expect(form.location).toBe("");
  });

  it("coerces null current to false", () => {
    const editor = mapTimelineToEditorDto(mockTimelineItem, languages);
    const form = mapTimelineToFormDto({
      ...editor,
      current: null as unknown as boolean,
    });
    expect(form.current).toBe(false);
  });
});

describe("buildEmptyTimelineCreateDto", () => {
  it("returns empty defaults for all fields", () => {
    const dto = buildEmptyTimelineCreateDto(languages);

    expect(dto.organization).toBe("");
    expect(dto.location).toBe("");
    expect(dto.category).toBe("WORK");
    expect(dto.startDate).toBe("");
    expect(dto.endDate).toBe("");
    expect(dto.current).toBe(false);
    expect(dto.images).toEqual([]);
    expect(dto.translations["lang-en"]).toEqual({ title: "", description: "" });
    expect(dto.translations["lang-es"]).toEqual({ title: "", description: "" });
  });
});

describe("getTimelineTranslationText", () => {
  it("retrieves the title for the requested locale", () => {
    const dto = mapTimelineToEditorDto(mockTimelineItem, languages);
    const title = getTimelineTranslationText(dto, languages, "es", "title");
    expect(title).toBe("Ingeniero");
  });

  it("falls back to English when locale is not available", () => {
    const dto = mapTimelineToEditorDto(mockTimelineItem, languages);
    const title = getTimelineTranslationText(dto, languages, "nl", "title");
    expect(title).toBe("Engineer");
  });

  it("retrieves the description field", () => {
    const dto = mapTimelineToEditorDto(mockTimelineItem, languages);
    const desc = getTimelineTranslationText(dto, languages, "en", "description");
    expect(desc).toBe("Built stuff");
  });
});
