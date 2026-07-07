import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

import type { Locale } from "@/i18n/config";

interface RenderWithIntlOptions extends RenderOptions {
  locale?: Locale;
}

export function renderWithIntl(
  ui: ReactElement,
  options: RenderWithIntlOptions = {},
) {
  return render(ui, options);
}
