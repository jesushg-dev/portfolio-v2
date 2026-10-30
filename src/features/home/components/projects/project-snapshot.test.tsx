import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import { CaseStudyContentSchema } from "@/features/projects/lib/case-study";
import ProjectSnapshot from "./project-snapshot";

describe("ProjectSnapshot", () => {
  it("renders standard single image preview for projects without gallery", () => {
    const project = {
      slug: "simple-project",
      image: "https://example.com/simple.jpg",
      title: "Simple Project",
      description: "Simple description",
      githubUrl: null,
      websiteUrl: "https://example.com",
      isPrivate: false,
      type: "FRONTEND",
      kind: "PERSONAL",
      status: "IN_PRODUCTION",
      startedAt: null,
      endedAt: null,
      caseStudy: CaseStudyContentSchema.parse({
        chips: [],
        facts: [],
        tldr: [],
        responsibilities: [],
        sections: [],
      }),
      skills: [{ title: "React", image: "" }],
    };

    renderWithIntl(<ProjectSnapshot project={project} />);

    expect(screen.getByAltText("Simple Project preview")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("renders multi-screen gallery tabs and thumbnails for walmart-centroamerica", () => {
    const project = {
      slug: "walmart-centroamerica",
      image: "/projects/walmart-centroamerica.jpg",
      title: "Walmart Centroamérica",
      description: "Multi-banner app",
      githubUrl: null,
      websiteUrl: null,
      isPrivate: true,
      type: "MOBILE",
      kind: "PROFESSIONAL",
      status: "IN_PRODUCTION",
      startedAt: null,
      endedAt: null,
      caseStudy: CaseStudyContentSchema.parse({
        chips: [],
        facts: [],
        gallery: [
          {
            title: "Multi-Banner",
            description: "Walmart, Maxi Palí & Masxmenos",
            image: "/projects/walmart-centroamerica.jpg",
            icon: "smartphone",
          },
          {
            title: "Maxi Palí",
            description: "Discount bodega & bulk savings",
            image: "/projects/walmart-maxipali.jpg",
            icon: "bag",
          },
          {
            title: "Masxmenos",
            description: "Supermarket & fresh groceries",
            image: "/projects/walmart-masxmenos.jpg",
            icon: "store",
          },
          {
            title: "Checkout & Pickup",
            description: "Electronic billing & store pickup",
            image: "/projects/walmart-checkout.jpg",
            icon: "truck",
          },
        ],
        tldr: [],
        responsibilities: [],
        sections: [],
      }),
      skills: [{ title: "Flutter", image: "" }],
    };

    renderWithIntl(<ProjectSnapshot project={project} />);

    // Verify tabs exist
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(4);

    // Initial image is Multi-Banner in EN locale
    expect(
      screen.getByAltText("Walmart Centroamérica - Multi-Banner"),
    ).toBeInTheDocument();

    // Click on Maxi Palí tab
    fireEvent.click(screen.getByRole("tab", { name: /Maxi Palí/i }));

    // Active image updates to Maxi Palí
    expect(
      screen.getByAltText("Walmart Centroamérica - Maxi Palí"),
    ).toBeInTheDocument();
  });
});
