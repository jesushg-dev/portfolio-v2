import { render, screen, fireEvent } from "@testing-library/react";
import SkillsTerminal from "./skills-terminal";
import type { SkillType } from "@/utils/interfaces/types";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, params?: Record<string, string | number>) => {
      if (key === "terminal.noMatch")
        return `grep: no match for "${params?.query}"`;
      if (typeof params?.count !== "undefined")
        return `${params.count} skills found`;
      if (typeof params?.query !== "undefined") return ` for "${params.query}"`;
      return key;
    },
}));

// Mock routing Link
jest.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string | { pathname: string };
    className?: string;
  }) => (
    <a
      href={typeof href === "string" ? href : href.pathname}
      className={className}
    >
      {children}
    </a>
  ),
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
    id: "0",
    userId: "user-1",
    title: "System Design",
    type: "ARCHITECTURE",
    featured: true,
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
    image: "/icons/docker.svg",
    createdAt: new Date(),
    description: "Docker platform",
    appLanguageId: "lang-1",
    skillId: "4",
    urlWiki: "https://docker.com",
  },
];

describe("SkillsTerminal", () => {
  it("renders header, summary badge, and initial frontend category skills", () => {
    render(<SkillsTerminal initialSkills={mockSkills} />);

    // Header & summary badge
    expect(screen.getByTestId("header-article")).toBeInTheDocument();
    expect(screen.getByText("expertise.json")).toBeInTheDocument();
    expect(screen.getByText("System Design")).toBeInTheDocument();

    // React is frontend, so not visible under architecture tab initially
    expect(screen.queryByText("React")).not.toBeInTheDocument();
  });

  it("switches category tab when clicked", () => {
    render(<SkillsTerminal initialSkills={mockSkills} />);

    const backendTab = screen.getByRole("tab", {
      name: /tabs\.backend\.title/i,
    });
    fireEvent.click(backendTab);

    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.queryByText("React")).not.toBeInTheDocument();
  });

  it("filters skills by search query across all categories", () => {
    render(<SkillsTerminal initialSkills={mockSkills} />);

    const searchInput = screen.getByRole("searchbox");
    fireEvent.change(searchInput, { target: { value: "docker" } });

    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.queryByText("React")).not.toBeInTheDocument();
    expect(screen.queryByText("Node.js")).not.toBeInTheDocument();
  });

  it("shows empty state when no skills match the search query", () => {
    render(<SkillsTerminal initialSkills={mockSkills} />);

    const searchInput = screen.getByRole("searchbox");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(screen.getByText(/grep: no match for/i)).toBeInTheDocument();
  });

  it("renders see certificates link", () => {
    render(<SkillsTerminal initialSkills={mockSkills} />);

    const certLink = screen.getByRole("link", {
      name: /modal\.seeCertificates/i,
    });
    expect(certLink).toBeInTheDocument();
    expect(certLink).toHaveAttribute("href", "/certificates");
  });
});
