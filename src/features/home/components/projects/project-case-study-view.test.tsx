import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import { CaseStudyContentSchema } from "@/features/projects/lib/case-study";
import ProjectCaseStudyView from "./project-case-study-view";

type InternalHref =
  | string
  | {
      pathname?: string;
      hash?: string;
      params?: Record<string, string>;
    };

interface MockLinkProps extends Omit<ComponentPropsWithoutRef<"a">, "href"> {
  children?: ReactNode;
  href: InternalHref;
}

jest.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: MockLinkProps) => {
    const targetHref =
      typeof href === "string"
        ? href
        : Object.entries(href.params ?? {}).reduce(
            (path, [key, value]) => path.replace(`[${key}]`, value),
            `${href.pathname ?? "/"}${href.hash ?? ""}`,
          );
    return (
      <a href={targetHref} {...props}>
        {children}
      </a>
    );
  },
}));

describe("ProjectCaseStudyView", () => {
  it("renders the reference section order and expandable decisions", () => {
    const project = {
      slug: "sample",
      image: "",
      title: "Sample project",
      description: "A concise project description.",
      hook: "A high-performance platform.",
      challenge: "Build a maintainable system for multiple tenants.",
      outcome: "A production-ready platform.",
      githubUrl: null,
      websiteUrl: null,
      isPrivate: false,
      type: "FRONTEND",
      kind: "PERSONAL",
      status: "IN_PRODUCTION",
      startedAt: null,
      endedAt: null,
      caseStudy: CaseStudyContentSchema.parse({
        chips: ["Personal", "Full-stack", "In production"],
        facts: [
          {
            key: "my-role",
            label: "My role",
            value: "Solo architect & developer",
          },
        ],
        nextProjectSlug: "musa-admin",
        context: "A multi-tenant platform.",
        roleTitle: "Solo architect & developer",
        roleIntro: "I owned the project end to end.",
        tldr: [
          {
            key: "impact",
            title: "Impact",
            summary: "",
            body: "Improved delivery speed.",
            value: "",
            icon: "gauge",
            tags: [],
            note: "",
          },
        ],
        responsibilities: [
          {
            key: "architecture",
            title: "Architecture",
            summary: "",
            body: "Designed the system architecture.",
            value: "",
            icon: "layers",
            tags: [],
            note: "",
          },
        ],
        constraints: ["Three supported locales"],
        sections: [
          {
            key: "decisions",
            kind: "DECISIONS",
            eyebrow: "Strategy",
            title: "Decisions & strategy",
            lead: "The important technical decisions.",
            code: "",
            codeLabel: "",
            items: [
              {
                key: "feature-architecture",
                title: "Feature-based architecture",
                summary: "Organize by product domain.",
                body: "Independent modules can evolve safely.",
                value: "",
                icon: "",
                tags: ["Layer-based structure"],
                note: "Shared code needs clear boundaries.",
              },
            ],
            footnoteTitle: "",
            footnotes: [],
            footnoteVariant: "default",
          },
          {
            key: "architecture",
            kind: "LAYERS",
            eyebrow: "How it fits together",
            title: "Architecture & approach",
            lead: "The request flows through the application layers.",
            code: "",
            codeLabel: "",
            items: [
              {
                key: "edge",
                title: "Edge · src/proxy.ts",
                summary: "",
                body: "",
                value: "",
                icon: "",
                tags: ["next-intl routing", "Tenant slug from Host"],
                note: "locale + tenant header",
              },
              {
                key: "app-router",
                title: "App Router · [locale]",
                summary: "",
                body: "",
                value: "",
                icon: "",
                tags: ["(home) public", "(admin) /admin", "/api/*"],
                note: "",
              },
            ],
            footnoteTitle: "",
            footnotes: [],
            footnoteVariant: "default",
          },
          {
            key: "data-model",
            kind: "CODE",
            eyebrow: "Data modeling",
            title: "Data model & i18n",
            lead: "Content is modeled as data.",
            code: "model Project {}",
            codeLabel: "schema.prisma",
            items: [],
            footnoteTitle: "",
            footnotes: [],
            footnoteVariant: "default",
          },
          {
            key: "data-model-numbers",
            kind: "METRICS",
            eyebrow: "",
            title: "Data model in numbers",
            lead: "",
            code: "",
            codeLabel: "",
            items: [
              {
                key: "models",
                title: "Prisma models",
                summary: "",
                body: "",
                value: "84",
                icon: "",
                tags: [],
                note: "",
              },
            ],
            footnoteTitle: "",
            footnotes: [],
            footnoteVariant: "default",
          },
          {
            key: "results",
            kind: "METRICS",
            eyebrow: "Results",
            title: "Outcome & results",
            lead: "",
            code: "",
            codeLabel: "",
            items: [],
            footnoteTitle: "",
            footnotes: [],
            footnoteVariant: "default",
          },
          {
            key: "scope",
            kind: "METRICS",
            eyebrow: "",
            title: "Scope of the codebase",
            lead: "",
            code: "",
            codeLabel: "",
            items: [
              {
                key: "features",
                title: "Feature modules",
                summary: "",
                body: "",
                value: "22",
                icon: "",
                tags: [],
                note: "",
              },
            ],
            footnoteTitle: "",
            footnotes: [],
            footnoteVariant: "default",
          },
        ],
      }),
      skills: [
        { title: "Next.js 16", image: "https://cdn.simpleicons.org/nextdotjs" },
        { title: "React 19", image: "https://cdn.simpleicons.org/react" },
      ],
    } satisfies Parameters<typeof ProjectCaseStudyView>[0]["project"];

    const { container } = renderWithIntl(
      <ProjectCaseStudyView project={project} />,
    );

    expect(
      [...container.querySelectorAll('section[id^="s-"]')].map(
        (section) => section.id,
      ),
    ).toEqual([
      "s-summary",
      "s-context",
      "s-role",
      "s-challenge",
      "s-decisions",
      "s-architecture",
      "s-data-model",
      "s-results",
    ]);
    expect(container.querySelector("#s-data-model-numbers")).toBeNull();
    expect(container.querySelector("#s-scope")).toBeNull();
    expect(screen.getByText("84")).toBeInTheDocument();
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getByText("Solo architect & developer")).toBeInTheDocument();
    expect(screen.getByText("Next.js 16")).toBeInTheDocument();
    expect(screen.getByText("Data & i18n")).toBeInTheDocument();
    const architectureSection = container.querySelector("#s-architecture");
    expect(architectureSection?.querySelectorAll("h3")).toHaveLength(0);
    expect(screen.getByText("Edge · src/proxy.ts").tagName.toLowerCase()).toBe(
      "p",
    );
    const firstLayerCard = architectureSection?.querySelector("ol > li > div");
    expect(firstLayerCard).not.toContainElement(
      screen.getByText("locale + tenant header"),
    );

    const previewCard =
      container.querySelector<HTMLElement>("[data-case-study-preview]");
    const factsCard =
      container.querySelector<HTMLElement>("[data-case-study-facts]");
    expect(previewCard).toBeInTheDocument();
    expect(factsCard).toBeInTheDocument();
    expect(previewCard?.parentElement).toBe(factsCard?.parentElement);
    expect(previewCard).not.toContainElement(factsCard);

    fireEvent(
      previewCard!,
      new MouseEvent("pointermove", {
        bubbles: true,
        clientX: 37,
        clientY: 42,
      }),
    );
    expect(previewCard).toHaveStyle({ "--x": "37px", "--y": "42px" });
    fireEvent.pointerOut(previewCard!, { relatedTarget: document.body });
    expect(previewCard).not.toHaveStyle({ "--x": "37px", "--y": "42px" });

    const decisionButton = screen.getByRole("button", {
      name: /Feature-based architecture/,
    });
    expect(decisionButton).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(decisionButton);
    expect(decisionButton).toHaveAttribute("aria-expanded", "false");
  });
});
