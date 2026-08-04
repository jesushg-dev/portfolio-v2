import { screen } from "@testing-library/react";
import React from "react";
import AdditionalInformation from "./additional-information";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { mockAppLanguages, mockCvPreviewData } from "@/test-utils/fixtures/cv-data";
import { mapCvDataToLocalized, type CvData } from "./types";

interface AdditionalSeed {
  id?: string;
  order?: number;
  translations: {
    appLanguageId?: string;
    text?: string;
  }[];
}

function getLocalizedAdditional(list: AdditionalSeed[]) {
  const mockData = {
    ...mockCvPreviewData,
    additionalInformation: list.map((item, index) => ({
      id: item.id ?? `additional-${index}`,
      order: item.order ?? 0,
      translations: item.translations.map((translation) => ({
        appLanguageId: translation.appLanguageId ?? "lang-en",
        text: translation.text ?? "",
      })),
    })),
  } satisfies CvData;

  return mapCvDataToLocalized(mockData, mockAppLanguages, "en")
    .additionalInformation;
}

describe("AdditionalInformation", () => {
  it("renders null when additionalInformation is empty array", () => {
    const { container } = renderWithIntl(
      <AdditionalInformation additionalInformation={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders additional information list when items are provided", () => {
    const items = [
      {
        id: "1",
        translations: [
          {
            appLanguageId: "lang-en",
            text: "Certified Kubernetes Administrator",
          },
        ],
      },
      {
        id: "2",
        translations: [
          { appLanguageId: "lang-en", text: "Speaker at TechConf 2023" },
        ],
      },
    ];

    renderWithIntl(
      <AdditionalInformation
        additionalInformation={getLocalizedAdditional(items)}
      />,
    );

    expect(
      screen.getByText(/Certified Kubernetes Administrator/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Speaker at TechConf 2023/)).toBeInTheDocument();
  });
});
