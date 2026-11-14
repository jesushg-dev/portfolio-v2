import type { ComponentProps, ReactNode } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { BlogCodeBlock } from "./blog-code-block";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      copyCode: "Copy",
      copiedCode: "Copied!",
      copyCodeAria: "Copy code to clipboard",
    };
    return messages[key] ?? key;
  },
}));

// Mock @tiptap/react NodeViewWrapper and NodeViewContent
jest.mock("@tiptap/react", () => {
  const actual =
    jest.requireActual<typeof import("@tiptap/react")>("@tiptap/react");
  return {
    ...actual,
    NodeViewWrapper: ({
      children,
      className,
      ...props
    }: ComponentProps<"div"> & { children?: ReactNode }) => (
      <div className={className} data-testid="node-view-wrapper" {...props}>
        {children}
      </div>
    ),
    NodeViewContent: ({ className, ...props }: ComponentProps<"code">) => (
      <code className={className} data-testid="node-view-content" {...props} />
    ),
  };
});

function createMockNode(attrs: { language: string }, textContent: string) {
  return {
    attrs,
    textContent,
  } as unknown as ReactNodeViewProps["node"];
}

describe("BlogCodeBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders code block with language label and copy button", () => {
    const node = createMockNode({ language: "typescript" }, "const hello = 'world';");

    render(<BlogCodeBlock node={node} />);

    expect(screen.getByText("typescript")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy code to clipboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("falls back to 'code' when language is not specified", () => {
    const node = createMockNode({ language: "" }, ".title-monitor-state/");

    render(<BlogCodeBlock node={node} />);

    expect(screen.getByText("code")).toBeInTheDocument();
  });

  it("copies code to clipboard when clicking copy button and toggles state", async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const node = createMockNode({ language: "bash" }, "pnpm install");

    render(<BlogCodeBlock node={node} />);

    const button = screen.getByRole("button", {
      name: "Copy code to clipboard",
    });
    fireEvent.click(button);

    expect(writeTextMock).toHaveBeenCalledWith("pnpm install");

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });

    // Advance timers by 2 seconds to verify it resets back to "Copy"
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText("Copy")).toBeInTheDocument();
    });
  });

  it("handles empty code gracefully without throwing", () => {
    const writeTextMock = jest.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const node = createMockNode({ language: "bash" }, "");

    render(<BlogCodeBlock node={node} />);

    const button = screen.getByRole("button", {
      name: "Copy code to clipboard",
    });
    fireEvent.click(button);

    expect(writeTextMock).not.toHaveBeenCalled();
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });
});
