import { isValidElement, type ReactNode } from "react";
import { render } from "@testing-library/react";

import PreloadTheme from "./preload-theme";

type ServerInsertedCallback = () => ReactNode;

let capturedCallback: ServerInsertedCallback | null = null;

jest.mock("next/navigation", () => ({
  useServerInsertedHTML: (callback: ServerInsertedCallback) => {
    capturedCallback = callback;
  },
}));

describe("PreloadTheme", () => {
  beforeEach(() => {
    capturedCallback = null;
  });

  it("returns null during React client render and does not render raw script in component DOM", () => {
    const { container } = render(<PreloadTheme />);
    expect(container.firstChild).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });

  it("registers theme script callback via useServerInsertedHTML for SSR streaming", () => {
    render(<PreloadTheme />);
    expect(capturedCallback).not.toBeNull();
    if (!capturedCallback) return;

    const insertedNode: unknown = capturedCallback();
    expect(isValidElement(insertedNode)).toBe(true);

    if (
      isValidElement<{
        id?: string;
        dangerouslySetInnerHTML?: { __html: string };
      }>(insertedNode)
    ) {
      expect(insertedNode.type).toBe("script");
      expect(insertedNode.props.id).toBe("theme-preload");
      expect(insertedNode.props.dangerouslySetInnerHTML?.__html).toContain(
        "custom-theme-active",
      );
    }
  });
});
