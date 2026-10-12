import { render, screen } from "@testing-library/react";

import { ProfileHeroPreview } from "./profile-hero-preview";

describe("ProfileHeroPreview", () => {
  it("renders preview with full name, subtitle, tagline, and summary", () => {
    render(
      <ProfileHeroPreview
        fullName="Jesús Hernández"
        photoUrl="https://example.com/photo.jpg"
        imageAlt="Foto de Jesús"
        heroSubtitle="Senior Software Engineer"
        heroTagline="6+ años construyendo plataformas escalables."
        heroSummary="Especialista en Next.js y Cloud."
        badgeLabel="Disponible para oportunidades"
      />,
    );

    expect(screen.getByText("Jesús")).toBeInTheDocument();
    expect(screen.getByText("Hernández")).toBeInTheDocument();
    expect(screen.getByText("Senior Software Engineer")).toBeInTheDocument();
    expect(
      screen.getByText("6+ años construyendo plataformas escalables."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Especialista en Next.js y Cloud."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Disponible para oportunidades"),
    ).toBeInTheDocument();
  });

  it("renders fallback initials when photoUrl is empty", () => {
    render(
      <ProfileHeroPreview
        fullName="Ada Lovelace"
        photoUrl=""
        imageAlt=""
        heroSubtitle="First Programmer"
        heroTagline="Algorithm pioneer."
        heroSummary=""
        badgeLabel="Available"
      />,
    );

    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("does not render availability badge when badgeLabel is empty", () => {
    render(
      <ProfileHeroPreview
        fullName="Ada Lovelace"
        photoUrl=""
        imageAlt=""
        heroSubtitle="First Programmer"
        heroTagline="Algorithm pioneer."
        heroSummary=""
        badgeLabel=""
      />,
    );

    expect(screen.queryByText("Available")).not.toBeInTheDocument();
  });

  it("does not render tagline element when heroTagline is empty", () => {
    const { container } = render(
      <ProfileHeroPreview
        fullName="Ada Lovelace"
        photoUrl=""
        imageAlt=""
        heroSubtitle=""
        heroTagline=""
        heroSummary=""
        badgeLabel=""
      />,
    );

    expect(container.querySelector("p")).toBeNull();
  });
});
