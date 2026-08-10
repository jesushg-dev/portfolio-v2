import { screen } from "@testing-library/react";
import React from "react";
import HeaderCV from "./index";
import ClientImage from "./client-image";
import { render } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import {
  mockAppLanguages,
  mockCvPreviewData,
} from "@/test-utils/fixtures/cv-data";
import { mapCvDataToLocalized, type CvData } from "../types";

interface RawHeaderTranslation {
  appLanguageId?: string;
  degree?: string;
  clientImageAlt?: string | null;
}

interface RawHeader {
  id?: string;
  fullName?: string;
  photoUrl?: string | null;
  translations?: RawHeaderTranslation[];
}

function getLocalizedHeader(header: RawHeader | null) {
  if (!header) return null;
  const mockData = {
    ...mockCvPreviewData,
    header: {
      id: header.id ?? "header-123",
      fullName: header.fullName ?? "",
      photoUrl: header.photoUrl ?? null,
      backgroundImageUrl: null,
      translations: (header.translations ?? []).map((t) => ({
        heroSubtitle: null,
        heroTagline: null,
        heroSummary: null,
        degree: t.degree ?? "",
        clientImageAlt: t.clientImageAlt ?? null,
        appLanguageId: t.appLanguageId ?? "lang-en",
      })),
    },
  };
  return mapCvDataToLocalized(
    mockData as unknown as CvData,
    mockAppLanguages,
    "en",
  ).header;
}

describe("ClientImage", () => {
  it("renders an image with custom alt text", () => {
    render(
      <ClientImage src="https://example.com/pic.jpg" alt="Profile photo" />,
    );
    const img = screen.getByAltText("Profile photo");
    expect(img).toBeInTheDocument();
  });

  it("renders default alt text when alt is omitted", () => {
    render(<ClientImage src="https://example.com/pic.jpg" />);
    const img = screen.getByAltText("Client Image");
    expect(img).toBeInTheDocument();
  });
});

describe("HeaderCV", () => {
  it("renders header degree and fullName when header data is provided", () => {
    const rawHeader = {
      fullName: "John Doe",
      photoUrl: "https://example.com/john.jpg",
      translations: [
        {
          appLanguageId: "lang-en",
          degree: "Software Engineer",
          clientImageAlt: "Photo of John",
        },
      ],
    };

    renderWithIntl(<HeaderCV header={getLocalizedHeader(rawHeader)} />);

    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByAltText("Photo of John")).toBeInTheDocument();
  });

  it("falls back to fallbackName when header fullName is missing", () => {
    const rawHeader = {
      translations: [
        {
          appLanguageId: "lang-en",
          degree: "Developer",
        },
      ],
    };

    renderWithIntl(
      <HeaderCV
        header={getLocalizedHeader(rawHeader)}
        fallbackName="Jane Doe"
      />,
    );

    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders empty string when fullName and fallbackName are missing", () => {
    const { container } = renderWithIntl(<HeaderCV header={null} />);

    expect(container).toBeInTheDocument();
  });

  it("omits photoUrl section when photoUrl is missing", () => {
    const rawHeader = {
      fullName: "No Photo Person",
    };

    renderWithIntl(<HeaderCV header={getLocalizedHeader(rawHeader)} />);

    expect(screen.queryByRole("img")).toBeNull();
  });
});
