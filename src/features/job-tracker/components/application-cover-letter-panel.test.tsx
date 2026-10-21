import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ApplicationCoverLetterDialog } from "./application-cover-letter-panel";

const mockUseUtils = jest.fn(() => ({
  jobTrackerAdmin: {
    getApplicationById: {
      invalidate: jest.fn(),
    },
  },
}));

const mockDraftMutate = jest.fn();
const mockSaveMutate = jest.fn();

jest.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => mockUseUtils(),
    jobTrackerAdmin: {
      getApplicationEmailCapabilities: {
        useQuery: () => ({
          data: {
            hasAiProvider: true,
            defaultProvider: "openai",
            providers: [
              { id: "openai", label: "OpenAI", model: "gpt-4o" },
              { id: "claude", label: "Claude", model: "claude-3-7-sonnet" },
            ],
          },
          isLoading: false,
        }),
      },
      getApplicationCoverLetterPrompt: {
        useQuery: () => ({
          data: {
            systemPrompt: "System instruction...",
            userPrompt: "Job description...",
            combinedPrompt:
              "SYSTEM:\nSystem instruction...\n\n---\n\nUSER:\nJob description...",
          },
          isLoading: false,
          refetch: jest.fn().mockResolvedValue({
            data: {
              systemPrompt: "System instruction...",
              userPrompt: "Job description...",
              combinedPrompt:
                "SYSTEM:\nSystem instruction...\n\n---\n\nUSER:\nJob description...",
            },
          }),
        }),
      },
      draftApplicationCoverLetter: {
        useMutation: () => ({
          mutate: mockDraftMutate,
          isPending: false,
        }),
      },
      saveApplicationCoverLetter: {
        useMutation: () => ({
          mutate: mockSaveMutate,
          isPending: false,
        }),
      },
    },
  },
}));

describe("ApplicationCoverLetterDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    applicationId: "app-123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders automatic mode with ResumeAiControls and triggers draft with selected provider", () => {
    renderWithIntl(<ApplicationCoverLetterDialog {...defaultProps} />);

    // By default in auto mode, manual editor fields are hidden
    expect(screen.queryByLabelText(/subject/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^letter$/i)).not.toBeInTheDocument();

    // In auto mode, draft button is available
    const draftBtn = screen.getByRole("button", {
      name: /draft with ai|borrador con ia/i,
    });
    expect(draftBtn).toBeInTheDocument();

    fireEvent.click(draftBtn);

    expect(mockDraftMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: "app-123",
        provider: "openai",
      }),
      expect.any(Object),
    );

    // Clicking "Write manually" reveals the fields and hides the generator controls
    const writeManuallyBtn = screen.getByRole("button", {
      name: /write manually|escribir manual/i,
    });
    fireEvent.click(writeManuallyBtn);
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^letter$/i)).toBeInTheDocument();

    // Generator mode selector is hidden, redraft button is shown
    expect(
      screen.queryByRole("button", { name: /^automatic/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /regenerate|volver a generar/i }),
    ).toBeInTheDocument();
  });

  it("switches to manual mode with ManualAiPanel, loads prompt, and applies pasted AI response", () => {
    renderWithIntl(<ApplicationCoverLetterDialog {...defaultProps} />);

    // Switch to manual mode via ResumeAiControls option
    const manualModeBtn = screen.getByRole("button", {
      name: /^manual/i,
    });
    fireEvent.click(manualModeBtn);

    // Verify copy prompt button in ManualAiPanel is rendered
    const copyPromptBtn = screen.getByRole("button", {
      name: /copy prompt|copiar prompt/i,
    });
    expect(copyPromptBtn).toBeInTheDocument();

    // Paste external AI response in ManualAiPanel textarea
    const pasteTextareas = screen.getAllByRole("textbox");
    // Find the textarea corresponding to manual reply
    const pasteTextarea = pasteTextareas.find(
      (t) => (t as HTMLTextAreaElement).rows === 2,
    );
    expect(pasteTextarea).toBeDefined();

    fireEvent.change(pasteTextarea!, {
      target: {
        value: JSON.stringify({
          subject: "Tailored Cover Letter for Acme",
          body: "Dear Hiring Team,\n\nI am thrilled to apply...",
        }),
      },
    });

    // Click apply / submit in ManualAiPanel
    const applyBtn = screen.getByRole("button", {
      name: /apply to letter|cargar en la carta/i,
    });
    fireEvent.click(applyBtn);

    // Form fields should be updated and visible
    const subjectInput = screen.getByRole("textbox", {
      name: /subject \/ title|asunto/i,
    });
    expect(subjectInput).toHaveValue("Tailored Cover Letter for Acme");

    const bodyTextarea = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: /^letter$|^carta$/i,
    });
    expect(bodyTextarea.value).toContain("Dear Hiring Team");
  });

  it("allows saving cover letter when subject and body are provided", () => {
    renderWithIntl(
      <ApplicationCoverLetterDialog
        {...defaultProps}
        initialSubject="Existing Subject"
        initialBody="Existing Body"
      />,
    );

    const saveBtn = screen.getByRole("button", {
      name: /save|guardar/i,
    });
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);

    expect(mockSaveMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: "app-123",
        subject: "Existing Subject",
        body: "Existing Body",
      }),
      expect.any(Object),
    );
  });
});
