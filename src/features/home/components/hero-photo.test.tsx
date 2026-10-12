import { render, screen } from "@testing-library/react";
import HeroPhoto from "./hero-photo";

describe("HeroPhoto", () => {
  it("renders initials when photoUrl is not provided", () => {
    render(
      <HeroPhoto
        heroData={{
          fullName: "Jesús Hernández",
          photoUrl: "",
          imageAlt: "Jesús Hernández",
        }}
      />,
    );

    expect(screen.getByText("JH")).toBeInTheDocument();
  });

  it("renders image when photoUrl is provided", () => {
    render(
      <HeroPhoto
        heroData={{
          fullName: "Jesús Hernández",
          photoUrl: "https://example.com/avatar.jpg",
          imageAlt: "Foto de perfil",
        }}
      />,
    );

    const img = screen.getByRole("img", { name: "Foto de perfil" });
    expect(img).toBeInTheDocument();
  });

  it("renders impact metric badge (MTTR) when provided", () => {
    render(
      <HeroPhoto
        heroData={{
          fullName: "Jesús Hernández",
          photoUrl: "",
          imageAlt: "profile",
        }}
        mttrBadge={{
          value: "-40% MTTR",
          label: "Critical Incidents",
        }}
      />,
    );

    expect(screen.getByText("-40% MTTR")).toBeInTheDocument();
    expect(screen.getByText("Critical Incidents")).toBeInTheDocument();
  });

  it("renders enterprise experience badge when experiences are provided", () => {
    render(
      <HeroPhoto
        heroData={{
          fullName: "Jesús Hernández",
          photoUrl: "",
          imageAlt: "profile",
        }}
        experiences={[
          { company: "Walmart", role: "Tech Lead" },
          { company: "Claro", role: "Staff Engineer" },
          { company: "Globant", role: "Senior Developer" },
        ]}
      />,
    );

    expect(screen.getByText("Walmart · Claro")).toBeInTheDocument();
    expect(screen.getByText("Globant")).toBeInTheDocument();
  });
});
