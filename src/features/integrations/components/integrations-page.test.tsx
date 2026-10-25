import { screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { IntegrationsPage } from "./integrations-page";
import { renderWithIntl } from "@/test-utils/render-with-intl";

const mockDeleteIntegration = jest.fn().mockResolvedValue({ ok: true });
const mockDisconnectSpotify = jest.fn().mockResolvedValue({ ok: true });
const mockDisconnectGCal = jest.fn().mockResolvedValue({ ok: true });
const mockSyncTemplates = jest
  .fn()
  .mockResolvedValue({ ok: true, syncedCount: 3 });
const mockInvalidateConfigs = jest.fn().mockResolvedValue(undefined);
const mockInvalidateSpotify = jest.fn().mockResolvedValue(undefined);
const mockInvalidateGCal = jest.fn().mockResolvedValue(undefined);

const mockConfigs = {
  resend: {
    isConfigured: true,
    emailDomain: "jesushg.com",
    fromEmail: "hi@jesushg.com",
    emailSignatureHtml: "",
    maskedApiKey: "re_1••••9999",
    syncedTemplatesCount: 4,
    lastSyncedAt: new Date(),
    lastError: null,
  },
  spotify: {
    isConfigured: true,
    clientId: "spot_client_123",
    maskedClientSecret: "sec••••9999",
    maskedRefreshToken: "ref••••9999",
  },
  uploadthing: {
    isConfigured: false,
    appId: "",
    maskedToken: "",
    maskedSecret: "",
  },
  ai: {
    isConfigured: true,
    hasGemini: true,
    hasOpenAi: false,
    hasAnthropic: false,
    hasDeepSeek: false,
    defaultProvider: "gemini",
    maskedGeminiApiKey: "AIza••••9999",
    maskedOpenAiApiKey: "",
    maskedAnthropicApiKey: "",
    maskedDeepseekApiKey: "",
  },
  ilovepdf: {
    isConfigured: false,
    maskedPublicKey: "",
    maskedSecretKey: "",
  },
};

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      integrationsAdmin: {
        getConfigs: { invalidate: mockInvalidateConfigs },
      },
      spotifyAdmin: {
        getConnectionStatus: { invalidate: mockInvalidateSpotify },
      },
      googleCalendarAdmin: {
        getConnectionStatus: { invalidate: mockInvalidateGCal },
      },
    }),
    integrationsAdmin: {
      getConfigs: {
        useQuery: () => ({
          data: mockConfigs,
          isLoading: false,
        }),
      },
      deleteIntegration: {
        useMutation: () => ({
          mutateAsync: mockDeleteIntegration,
          isPending: false,
        }),
      },
      syncResendTemplates: {
        useMutation: () => ({
          mutateAsync: mockSyncTemplates,
          isPending: false,
        }),
      },
    },
    spotifyAdmin: {
      getConnectionStatus: {
        useQuery: () => ({
          data: { status: "connected", clientId: "spot_client_123" },
          isLoading: false,
        }),
      },
      disconnect: {
        useMutation: () => ({
          mutateAsync: mockDisconnectSpotify,
          isPending: false,
        }),
      },
    },
    googleCalendarAdmin: {
      getConnectionStatus: {
        useQuery: () => ({
          data: { status: "disconnected", clientId: null },
          isLoading: false,
        }),
      },
      disconnect: {
        useMutation: () => ({
          mutateAsync: mockDisconnectGCal,
          isPending: false,
        }),
      },
    },
  },
}));

describe("IntegrationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders page header, security banner and ratio badge", () => {
    renderWithIntl(<IntegrationsPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /credentials & integrations/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 / 6")).toBeInTheDocument();
    expect(screen.getByText("AES-256")).toBeInTheDocument();
  });

  it("renders connected and available cards with proper statuses", () => {
    renderWithIntl(<IntegrationsPage />);

    // Connected: Resend, Spotify, AI (3)
    const configuredBadges = screen.getAllByText("Configured");
    expect(configuredBadges).toHaveLength(3);

    // Available: UploadThing, Google Calendar, iLovePDF (3)
    const notConfiguredBadges = screen.getAllByText("Not Configured");
    expect(notConfiguredBadges).toHaveLength(3);

    expect(screen.getByText("jesushg.com")).toBeInTheDocument();
    expect(screen.getByText("spot_client_123")).toBeInTheDocument();
  });

  it("filters cards when switching tabs", () => {
    renderWithIntl(<IntegrationsPage />);

    // Switch to "Connected" tab
    const connectedTab = screen.getByRole("tab", { name: /connected/i });
    fireEvent.click(connectedTab);

    // Only 3 configured items should be visible
    expect(screen.getAllByText("Configured")).toHaveLength(3);
    expect(screen.queryByText("Not Configured")).not.toBeInTheDocument();

    // Switch to "Available" tab
    const availableTab = screen.getByRole("tab", { name: /available/i });
    fireEvent.click(availableTab);

    // Only 3 available items should be visible
    expect(screen.getAllByText("Not Configured")).toHaveLength(3);
    expect(screen.queryByText("Configured")).not.toBeInTheDocument();
  });

  it("opens disconnect confirmation dialog and performs disconnect mutation", async () => {
    const { container } = renderWithIntl(<IntegrationsPage />);

    // Disconnect Spotify
    const spotifyArticle = container.querySelector(
      '[data-integration="spotify"]',
    );
    expect(spotifyArticle).toBeInTheDocument();
    const spotifyDisconnectBtn = spotifyArticle?.querySelector(
      'button[class*="destructive"]',
    );
    expect(spotifyDisconnectBtn).toBeInTheDocument();
    if (!spotifyDisconnectBtn) throw new Error("Button not found");

    fireEvent.click(spotifyDisconnectBtn);

    expect(
      await screen.findByRole("heading", { name: /disconnect/i }),
    ).toBeInTheDocument();

    const dialogButtons = screen.getAllByRole("button", {
      name: /^disconnect$/i,
    });
    const confirmDialogBtn = dialogButtons[dialogButtons.length - 1];
    fireEvent.click(confirmDialogBtn);

    await waitFor(() => {
      expect(mockDisconnectSpotify).toHaveBeenCalled();
      expect(mockInvalidateSpotify).toHaveBeenCalled();
    });
  });
});
