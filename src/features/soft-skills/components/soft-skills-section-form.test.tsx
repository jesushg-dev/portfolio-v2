import { screen, fireEvent, waitFor } from "@testing-library/react";
import { SoftSkillsSectionForm } from "./soft-skills-section-form";
import { renderWithIntl } from "@/test-utils/render-with-intl";

const mockUpsertMutateAsync = jest.fn().mockResolvedValue({ id: "sec-1" });
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
      softSkillsAdmin: {
        getSection: {
          invalidate: mockInvalidate,
        },
      },
    }),
    softSkillsAdmin: {
      upsertSection: {
        useMutation: () => ({
          mutateAsync: mockUpsertMutateAsync,
          isPending: false,
          error: null,
        }),
      },
    },
  },
}));

describe("SoftSkillsSectionForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders video fields when mediaType is VIDEO", () => {
    renderWithIntl(
      <SoftSkillsSectionForm
        initialData={{
          id: "sec-1",
          userId: "u1",
          mediaType: "VIDEO",
          videoUrl: "https://example.com/video.mp4",
          posterUrl: "https://example.com/poster.jpg",
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          metrics: [],
        }}
      />,
    );

    expect(
      screen.getByDisplayValue("https://example.com/video.mp4"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://example.com/poster.jpg"),
    ).toBeInTheDocument();
  });

  it("submits updated section configuration", async () => {
    renderWithIntl(
      <SoftSkillsSectionForm
        initialData={{
          id: "sec-1",
          userId: "u1",
          mediaType: "VIDEO",
          videoUrl: "https://example.com/video.mp4",
          posterUrl: "https://example.com/poster.jpg",
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          metrics: [],
        }}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: /save|guardar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpsertMutateAsync).toHaveBeenCalledWith({
        mediaType: "VIDEO",
        videoUrl: "https://example.com/video.mp4",
        posterUrl: "https://example.com/poster.jpg",
        imageUrl: "",
      });
      expect(mockInvalidate).toHaveBeenCalled();
      expect(mockRouterBack).toHaveBeenCalled();
    });
  });

  it("renders metrics tab and handles adding a metric", () => {
    const mockLanguages = [
      {
        id: "lang-en",
        code: "en",
        name: "English",
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    renderWithIntl(
      <SoftSkillsSectionForm
        languages={mockLanguages}
        initialData={{
          id: "sec-1",
          userId: "u1",
          mediaType: "VIDEO",
          videoUrl: "https://example.com/video.mp4",
          posterUrl: "https://example.com/poster.jpg",
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          metrics: [
            {
              id: "m-1",
              sectionId: "sec-1",
              value: "40%",
              order: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              SoftSkillsMetricTranslation: [
                {
                  id: "t-1",
                  metricId: "m-1",
                  appLanguageId: "lang-en",
                  label: "Engineers mentored",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ],
            },
          ],
        }}
      />,
    );

    const metricsTab = screen.getByRole("tab", { name: /metrics|métricas/i });
    expect(metricsTab).toBeInTheDocument();
    fireEvent.click(metricsTab);

    expect(screen.getByDisplayValue("40%")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Engineers mentored")).toBeInTheDocument();

    const addBtn = screen.getByRole("button", {
      name: /add metric|añadir métrica/i,
    });
    fireEvent.click(addBtn);

    expect(screen.getByText("#2")).toBeInTheDocument();
  });
});
