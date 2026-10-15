import { render, screen } from "@testing-library/react";
import SocialProof from "./index";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      eyebrow: "Trusted by developers",
      title: "What senior developers say about me",
      subtitle: "Colleagues who have seen my work up close.",
      yearsExperience: "Years of experience",
      projectsCount: "Projects delivered",
      certificationsCount: "Certifications",
      hireMe: "Hire me",
      statsFootnote: "Numbers accumulated across professional engagements.",
    };
    return map[key] || key;
  },
  useLocale: () => "en",
}));

jest.mock("@/components/app-layout/public-cv-visible", () => ({
  usePublicCvVisible: () => true,
}));

jest.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    portfolio: {
      getTestimonialsPublic: {
        useQuery: () => ({
          data: [
            {
              id: "t1",
              quote:
                "Jesús is an exceptional engineer who elevated our architecture and delivery.",
              author: "Mauricio Arias",
              role: "Software Engineer · Capstone Logistics",
              avatarUrl: null,
              linkedInUrl: null,
            },
          ],
          isLoading: false,
        }),
      },
    },
  },
}));

describe("SocialProof Component", () => {
  const mockStats = {
    yearsExperience: 6,
    projectsCount: 19,
    certificationsCount: 49,
    engineersMentored: 6,
  };

  it("renders testimonials quote and Bento stats correctly", () => {
    render(<SocialProof stats={mockStats} />);

    expect(
      screen.getByText("What senior developers say about me"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mauricio Arias/i)).toBeInTheDocument();
    expect(screen.getByText(/19\+/i)).toBeInTheDocument();
    expect(screen.getByText(/6\+/i)).toBeInTheDocument();
  });
});
