import { screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectForm } from "./project-form";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import type { AppLanguage } from "@prisma/client";
import type { ProjectEditorDTO } from "../lib/project-editor-dto";
import { buildEmptyCaseStudy } from "../lib/case-study";

const mockUpdateMutateAsync = jest.fn().mockResolvedValue({ id: "proj-1" });
const mockCreateMutateAsync = jest.fn().mockResolvedValue({ id: "proj-2" });
const mockInvalidate = jest.fn().mockResolvedValue(undefined);

const mockRouterBack = jest.fn();
const mockStartUpload = jest
  .fn()
  .mockResolvedValue([{ ufsUrl: "https://cdn.example.com/project-cover.jpg" }]);
jest.mock("@/lib/uploadthing", () => ({
  useUploadThing: () => ({ startUpload: mockStartUpload, isUploading: false }),
}));
jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-slot="scroll-area" className={className}>
      {children}
    </div>
  ),
  ScrollBar: () => null,
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockRouterBack,
    push: jest.fn(),
  }),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      projectsAdmin: {
        getMine: {
          invalidate: mockInvalidate,
        },
      },
    }),
    projectsAdmin: {
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
    skillsAdmin: {
      getMine: {
        useQuery: () => ({
          data: {
            data: [
              {
                id: "sk-1",
                title: "React",
                image: "/react.png",
                type: "FRONTEND",
              },
              {
                id: "sk-2",
                title: "Node.js",
                image: "/node.png",
                type: "BACKEND",
              },
            ],
          },
        }),
      },
    },
    certificationsAdmin: {
      getMine: {
        useQuery: () => ({
          data: {
            data: [
              {
                id: "cert-1",
                company: "Google",
                translations: { en: { title: "Cloud Architect" } },
              },
            ],
          },
          isLoading: false,
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

const mockInitialData: ProjectEditorDTO = {
  id: "proj-1",
  image: "https://example.com/cover.jpg",
  type: "FRONTEND",
  githubUrl: "https://github.com/example/repo",
  websiteUrl: "https://example.com",
  isPrivate: false,
  skillIds: ["sk-1"],
  certificateIds: ["cert-1"],
  order: 1,
  kind: "PROFESSIONAL",
  slug: "portfolio-website",
  caseStudyEnabled: true,
  status: "IN_PRODUCTION",
  startedAt: "2024-01-01",
  endedAt: "2024-06-01",
  teamSize: 3,
  translations: {
    "lang-en": {
      title: "Portfolio Website",
      description: "My personal website built with Next.js",
      caseStudy: buildEmptyCaseStudy(),
    },
    "lang-es": {
      title: "Sitio Web Portafolio",
      description: "Mi sitio personal construido con Next.js",
      caseStudy: buildEmptyCaseStudy(),
    },
  },
};

describe("ProjectForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the 4 canonical tabs and general tab by default", () => {
    renderWithIntl(
      <ProjectForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /content/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /skills/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /certificates/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/image url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/team size/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("portfolio-website")).toBeInTheDocument();
  });

  it("navigates to Content tab and displays languages and title/description fields", () => {
    renderWithIntl(
      <ProjectForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    const contentTab = screen.getByRole("tab", { name: /content/i });
    fireEvent.click(contentTab);

    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Portfolio Website")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("My personal website built with Next.js"),
    ).toBeInTheDocument();
  });

  it("navigates to Skills tab and toggles skills", () => {
    renderWithIntl(
      <ProjectForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    const skillsTab = screen.getByRole("tab", { name: /skills/i });
    fireEvent.click(skillsTab);

    expect(screen.getAllByText("React").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Node.js")).toBeInTheDocument();
  });

  it("navigates to Certificates tab and displays certificate picker", () => {
    renderWithIntl(
      <ProjectForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    const certsTab = screen.getByRole("tab", { name: /certificates/i });
    fireEvent.click(certsTab);

    expect(
      screen.getAllByText("Cloud Architect").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Google")).toBeInTheDocument();
  });

  it("submits the form and calls update mutation", async () => {
    renderWithIntl(
      <ProjectForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    const saveButton = screen.getByRole("button", { name: /^save$/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "proj-1",
          image: "https://example.com/cover.jpg",
          type: "FRONTEND",
          slug: "portfolio-website",
          skillIds: ["sk-1"],
          certificateIds: ["cert-1"],
        }),
      );
    });
  });

  it("uploads a cover before submitting its permanent URL", async () => {
    renderWithIntl(
      <ProjectForm initialData={mockInitialData} languages={mockLanguages} />,
    );
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    fireEvent.change(input!, {
      target: {
        files: [new File(["image"], "cover.png", { type: "image/png" })],
      },
    });
    await waitFor(() =>
      expect(
        screen.getByDisplayValue("https://cdn.example.com/project-cover.jpg"),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() =>
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          image: "https://cdn.example.com/project-cover.jpg",
        }),
      ),
    );
  });
});
