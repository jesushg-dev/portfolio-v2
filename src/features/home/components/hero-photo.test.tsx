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
});
