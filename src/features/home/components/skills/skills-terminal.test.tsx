import { render, screen } from "@testing-library/react";
import SkillsTerminal from "./skills-terminal";
import type { SkillType } from "@/utils/interfaces/types";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: "Technical Stack",
      subtitle: "Skills",
      description: "Technologies in this portfolio",
      updatedTech: "Updated technologies 2024–2026",
      seeCertificates: "See certificates",
    };
    return translations[key] ?? key;
  },
  useLocale: () => "en",
}));

// Mock routing Link
jest.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string | { pathname: string; params?: Record<string, string> };
    className?: string;
  }) => {
    let resolvedHref = typeof href === "string" ? href : href.pathname;
    if (typeof href !== "string" && href.params) {
      for (const [key, val] of Object.entries(href.params)) {
        resolvedHref = resolvedHref.replace(`[${key}]`, val);
      }
    }
    return (
      <a href={resolvedHref} className={className}>
        {children}
      </a>
    );
  },
}));

// Mock HeaderArticle
jest.mock("@/components/shared/header-article", () => ({
  __esModule: true,
  default: ({
    title,
    subtitle,
  }: {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
  }) => (
    <div data-testid="header-article">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  ),
}));

const mockSkills: SkillType[] = [
  {
    id: "ai-1",
    userId: "user-1",
    title: "OpenAI GPT-4o",
    type: "AI",
    featured: true,
    trend: true,
    image: "/icons/openai.svg",
    createdAt: new Date(),
    description: "OpenAI GPT-4o model",
    appLanguageId: "lang-1",
    skillId: "ai-1",
    urlWiki: "https://openai.com",
  },
  {
    id: "0",
    userId: "user-1",
    title: "Clean Architecture",
    type: "ARCHITECTURE",
    featured: true,
    trend: false,
    image: "/icons/arch.svg",
    createdAt: new Date(),
    description: "System Design",
    appLanguageId: "lang-1",
    skillId: "0",
    urlWiki: "https://example.com",
  },
  {
    id: "1",
    userId: "user-1",
    title: "React",
    type: "FRONTEND",
    featured: true,
    trend: false,
    image: "/icons/react.svg",
    createdAt: new Date(),
    description: "React library",
    appLanguageId: "lang-1",
    skillId: "1",
    urlWiki: "https://react.dev",
  },
  {
    id: "2",
    userId: "user-1",
    title: "Tailwind CSS",
    type: "FRONTEND",
    featured: false,
    trend: false,
    image: "/icons/tailwind.svg",
    createdAt: new Date(),
    description: "Tailwind CSS framework",
    appLanguageId: "lang-1",
    skillId: "2",
    urlWiki: "https://tailwindcss.com",
  },
  {
    id: "3",
    userId: "user-1",
    title: "Node.js",
    type: "BACKEND",
    featured: true,
    trend: false,
    image: "/icons/node.svg",
    createdAt: new Date(),
    description: "Node runtime",
    appLanguageId: "lang-1",
    skillId: "3",
    urlWiki: "https://nodejs.org",
  },
  {
    id: "4",
    userId: "user-1",
    title: "Docker",
    type: "TOOLS",
    featured: false,
    trend: false,
    image: "/icons/docker.svg",
    createdAt: new Date(),
    description: "Docker platform",
    appLanguageId: "lang-1",
    skillId: "4",
    urlWiki: "https://docker.com",
  },
];

describe("SkillsTerminal Spec Sheet", () => {
  it("renders header, chrome bar with expertise.json, and all spec categories", () => {
    render(<SkillsTerminal initialSkills={mockSkills} showHeader />);

    expect(screen.getByTestId("header-article")).toBeInTheDocument();
    expect(screen.getByText("expertise.json")).toBeInTheDocument();

    // Verify all JSON keys are present in definition list
    expect(screen.getByText("frontend")).toBeInTheDocument();
    expect(screen.getByText("backend")).toBeInTheDocument();
    expect(screen.getByText("architecture")).toBeInTheDocument();
    expect(screen.getByText("ai")).toBeInTheDocument();
    expect(screen.getByText("data")).toBeInTheDocument();
    expect(screen.getByText("delivery")).toBeInTheDocument();
  });

  it("renders skills with links under their categories", () => {
    render(<SkillsTerminal initialSkills={mockSkills} />);

    const reactLink = screen.getByRole("link", { name: "React" });
    expect(reactLink).toBeInTheDocument();
    expect(reactLink).toHaveAttribute("href", "/skills/react");

    const nodeLink = screen.getByRole("link", { name: "Node.js" });
    expect(nodeLink).toBeInTheDocument();
    expect(nodeLink).toHaveAttribute("href", "/skills/node-js");

    const openAiLink = screen.getByRole("link", { name: "OpenAI GPT-4o" });
    expect(openAiLink).toBeInTheDocument();
    expect(openAiLink).toHaveAttribute("href", "/skills/openai-gpt-4o");
  });

  it("renders footer with updated technologies badge and certificates link", () => {
    render(<SkillsTerminal initialSkills={mockSkills} />);

    expect(
      screen.getByText("Updated technologies 2024–2026"),
    ).toBeInTheDocument();

    const certLink = screen.getByRole("link", {
      name: /see certificates/i,
    });
    expect(certLink).toBeInTheDocument();
    expect(certLink).toHaveAttribute("href", "/certificates");
  });
});
