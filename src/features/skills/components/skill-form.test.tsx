import { screen, fireEvent, waitFor } from "@testing-library/react";
import { SkillForm } from "./skill-form";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import type { AppLanguage } from "@prisma/client";
import type { SkillEditorDTO } from "../lib/skill-editor-dto";

const mockUpdateMutateAsync = jest.fn().mockResolvedValue({ id: "sk-1" });
const mockCreateMutateAsync = jest.fn().mockResolvedValue({ id: "sk-2" });
const mockInvalidate = jest.fn().mockResolvedValue(undefined);
const mockRouterBack = jest.fn();

jest.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    back: mockRouterBack,
    push: jest.fn(),
  }),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      skillsAdmin: {
        getMine: {
          invalidate: mockInvalidate,
        },
      },
    }),
    skillsAdmin: {
      createItem: {
        useMutation: () => ({
          mutateAsync: mockCreateMutateAsync,
          isPending: false,
          error: null,
        }),
      },
      updateItem: {
        useMutation: () => ({
          mutateAsync: mockUpdateMutateAsync,
          isPending: false,
          error: null,
        }),
      },
    },
  },
}));

const mockLanguages = [
  {
    id: "lang-en",
    code: "en",
    name: "English",
  },
  {
    id: "lang-es",
    code: "es",
    name: "Español",
  },
] as unknown as AppLanguage[];

const mockInitialData: SkillEditorDTO = {
  id: "sk-1",
  title: "TypeScript",
  image: "https://example.com/ts.png",
  type: "FRONTEND",
  featured: true,
  projectCount: 4,
  certificateCount: 1,
  translations: {
    "lang-en": {
      description: "Typed superset of JavaScript",
      urlWiki: "https://en.wikipedia.org/wiki/TypeScript",
    },
    "lang-es": {
      description: "Superconjunto tipado de JavaScript",
      urlWiki: "https://es.wikipedia.org/wiki/TypeScript",
    },
  },
};

describe("SkillForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders canonical line tabs and general tab by default", () => {
    renderWithIntl(
      <SkillForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /content/i })).toBeInTheDocument();

    expect(screen.getByDisplayValue("TypeScript")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://example.com/ts.png"),
    ).toBeInTheDocument();
  });

  it("navigates to Content tab and renders AdminFormLanguageBar and fields", () => {
    renderWithIntl(
      <SkillForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    const contentTab = screen.getByRole("tab", { name: /content/i });
    fireEvent.click(contentTab);

    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Typed superset of JavaScript"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://en.wikipedia.org/wiki/TypeScript"),
    ).toBeInTheDocument();
  });

  it("opens and preserves a blank translation while switching languages", () => {
    renderWithIntl(
      <SkillForm
        initialData={{
          ...mockInitialData,
          translations: { "lang-en": mockInitialData.translations["lang-en"]! },
        }}
        languages={mockLanguages}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /content/i }));
    fireEvent.click(screen.getByRole("tab", { name: /Español/i }));
    fireEvent.click(screen.getByRole("button", { name: "Start blank" }));
    const description = screen.getByRole("textbox", { name: /description/i });
    expect(description).toHaveValue("");
    fireEvent.change(description, { target: { value: "Nueva descripción" } });
    fireEvent.click(screen.getByRole("tab", { name: /English/i }));
    fireEvent.click(screen.getByRole("tab", { name: /Español/i }));
    expect(screen.getByRole("textbox", { name: /description/i })).toHaveValue(
      "Nueva descripción",
    );
  });

  it("submits the form with updated data in edit mode", async () => {
    renderWithIntl(
      <SkillForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    const submitBtn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sk-1",
        title: "TypeScript",
        type: "FRONTEND",
      }),
    );
  });
});
