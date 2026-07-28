import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import { ResumeImportWorkflow } from "./resume-import-workflow";

jest.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    integrationsAdmin: {
      getConfigs: {
        useQuery: () => ({
          isLoading: false,
          data: { uploadthing: { isConfigured: true } },
        }),
      },
      uploadFile: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
        }),
      },
    },
    resumeEngineAdmin: {
      getAiSettings: {
        useQuery: () => ({
          isLoading: false,
          data: {
            hasAutoProviders: true,
            defaultProvider: "gemini",
            providers: [{ id: "gemini", name: "Google Gemini", active: true }],
          },
        }),
      },
      getImportPrompt: {
        useQuery: () => ({
          isLoading: false,
          data: null,
        }),
      },
      registerUpload: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
        }),
      },
      parseUpload: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
        }),
      },
      submitManualImportDraft: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
        }),
      },
      confirmImport: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
        }),
      },
    },
  },
}));

describe("ResumeImportWorkflow", () => {
  it("renders upload step initially with drag and drop zone", () => {
    renderWithIntl(<ResumeImportWorkflow />);

    expect(screen.getByText(/Upload your resume/i)).toBeInTheDocument();
  });
});
