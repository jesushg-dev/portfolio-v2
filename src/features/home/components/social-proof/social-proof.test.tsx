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
      cta: "Hire me",
      readMore: "Read more",
      readLess: "Read less",
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

  it("renders read more button and toggles expansion on long quotes", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const longQuoteTestimonial = [
      {
        id: "t2",
        quote:
          "I worked with Jesús at Contollo leading complex deliveries. What defines him as a senior engineer is his level of ownership: he takes on end-to-end design, makes decisions with great technical judgment, and operates with complete autonomy. He is the engineer you trust with the hardest problems.",
        author: "Mauricio Arias",
        role: "Software Engineer · Capstone Logistics (Contollo)",
        avatarUrl: null,
        linkedInUrl: null,
      },
    ];

    render(
      <SocialProof stats={mockStats} testimonials={longQuoteTestimonial} />,
    );

    const toggleBtn = screen.getByRole("button", { name: /read more/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggleBtn);
    expect(
      screen.getByRole("button", { name: /read less/i }),
    ).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggleBtn);
    expect(
      screen.getByRole("button", { name: /read more/i }),
    ).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
  });
});
