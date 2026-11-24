import { fireEvent, screen, waitFor } from "@testing-library/react";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ResumeTailorWorkflow } from "./resume-tailor-workflow";

const mockDiscover = jest.fn();
const mockGenerate = jest.fn();
const mockGenerateManual = jest.fn();
const mockCorrectionPrompt = jest.fn();
const mockDeleteEquivalence = jest.fn();
jest.mock("sonner", () => ({
  toast: { info: jest.fn(), error: jest.fn(), success: jest.fn() },
}));
jest.mock("@/trpc/react", () => ({
  api: {
    resumeEngineAdmin: {
      getAiSettings: {
        useQuery: () => ({
          data: {
            hasAutoProviders: true,
            defaultProvider: "openai",
            providers: [],
          },
        }),
      },
      getTailorPageData: {
        useQuery: () => ({
          data: {
            hasStudioData: true,
            declaredTechnologies: [],
            application: {
              description: "We build our services with quiet oak.",
            },
          },
        }),
      },
      getTailorPrompt: { useQuery: () => ({}) },
      getTailorCorrectionPrompt: {
        useMutation: () => ({
          mutateAsync: mockCorrectionPrompt,
          isPending: false,
        }),
      },
      deleteTechnologyEquivalence: {
        useMutation: () => ({
          mutateAsync: mockDeleteEquivalence,
          isPending: false,
        }),
      },
      discoverVacancyTechnologies: {
        useMutation: () => ({ mutateAsync: mockDiscover }),
      },
      tailorResume: { useMutation: () => ({ mutateAsync: mockGenerate }) },
      tailorResumeManual: {
        useMutation: () => ({ mutateAsync: mockGenerateManual }),
      },
    },
  },
}));
jest.mock("./resume-tailor-result-view", () => ({
  ResumeTailorResultView: () => null,
}));

it.each([true, false])(
  "reviews an unfamiliar AI-discovered name before automatic export (confirmed %s)",
  async (confirm) => {
    mockDiscover.mockClear().mockResolvedValue(["quiet oak"]);
    mockGenerate
      .mockClear()
      .mockResolvedValue({ downloadUrl: "/cv.docx", aiScore: 70 });
    renderWithIntl(<ResumeTailorWorkflow applicationId="test" embedded />);
    fireEvent.click(screen.getByRole("button", { name: "Tailor resume" }));
    const term = await screen.findByRole("checkbox", { name: "quiet oak" });
    expect(mockGenerate).not.toHaveBeenCalled();
    if (confirm) fireEvent.click(term);
    const generate = screen.getByRole("button", { name: "Tailor resume" });
    await waitFor(() => expect(generate).toBeEnabled());
    fireEvent.click(generate);
    await waitFor(() =>
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmedTechnologies: confirm ? ["quiet oak"] : [],
          vacancyTechnologies: ["quiet oak"],
        }),
      ),
    );
    expect(mockDiscover).toHaveBeenCalledTimes(1);
  },
);

it.each(["REST APIs", ""])(
  "shows the proposed technology in the notification and error panel (saved name %s)",
  async (original) => {
    const proposed = "GraphQL";
    const issue = {
      fieldId: "technologyNames[0]",
      field: "technologyName",
      original,
      proposed,
      reason: original ? "technologyIdentity" : "technologyNotSelected",
    };
    mockDiscover.mockResolvedValue([]);
    mockGenerate.mockRejectedValueOnce(
      TRPCClientError.from({
        error: {
          code: -32600,
          message: "Validation failed",
          data: { resumeTailorIssues: [issue] },
        },
      }),
    );
    renderWithIntl(<ResumeTailorWorkflow applicationId="test" embedded />);
    fireEvent.click(screen.getByRole("button", { name: "Tailor resume" }));
    expect(await screen.findByText(proposed)).toBeVisible();
    expect(
      screen.getByText(
        original ||
          "The original technology could not be identified in your CV.",
      ),
    ).toBeVisible();
    expect(toast.error).toHaveBeenCalledWith(expect.any(String), {
      description: original
        ? "Review the change from “REST APIs” to “GraphQL”."
        : "Review “GraphQL”. The proposal does not identify a technology saved in your CV.",
    });
  },
);

it("lets the user confirm an equivalence to continue or generate a manual correction prompt when rejected", async () => {
  const pair = { original: "REST APIs", proposed: "RESTful APIs" };
  const identityError = TRPCClientError.from({
    error: {
      code: -32600,
      message:
        "Resume validation failed:\nTechnology name “REST APIs” → “RESTful APIs”: display name belongs to a different technology.",
      data: {
        resumeTailorIssues: [
          {
            fieldId: "technologyNames[0]",
            field: "technologyName",
            original: pair.original,
            proposed: pair.proposed,
            reason: "technologyIdentity",
          },
        ],
      },
    },
  });

  mockDiscover.mockResolvedValue([]);
  mockGenerateManual
    .mockReset()
    .mockRejectedValueOnce(identityError)
    .mockResolvedValueOnce({ downloadUrl: "/cv.docx", aiScore: 88 });
  mockCorrectionPrompt.mockReset().mockResolvedValue({
    systemPrompt: "sys",
    userPrompt: "usr",
    combinedPrompt: "SYSTEM:\nsys\n\nUSER:\nfix RESTful APIs",
  });

  renderWithIntl(<ResumeTailorWorkflow applicationId="test" embedded />);
  fireEvent.click(screen.getByRole("radio", { name: /Manual/i }));
  fireEvent.change(await screen.findByPlaceholderText(/detectedLocale/i), {
    target: { value: '{"schemaVersion":1}' },
  });
  fireEvent.click(screen.getByRole("button", { name: "Tailor resume" }));

  const rejectBtn = await screen.findByRole("button", {
    name: "No, create AI correction prompt",
  });
  await waitFor(() => expect(rejectBtn).toBeEnabled());
  fireEvent.click(rejectBtn);

  await waitFor(() =>
    expect(mockCorrectionPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        rejectedTechnologyEquivalences: [pair],
        previousRawJson: '{"schemaVersion":1}',
      }),
    ),
  );
  expect(await screen.findByText("AI correction prompt")).toBeVisible();

  const confirmBtn = screen.getByRole("button", {
    name: "Yes, they’re equivalent & continue",
  });
  await waitFor(() => expect(confirmBtn).toBeEnabled());
  fireEvent.click(confirmBtn);

  await waitFor(() =>
    expect(mockGenerateManual).toHaveBeenLastCalledWith(
      expect.objectContaining({
        technologyEquivalences: [pair],
      }),
    ),
  );
});
