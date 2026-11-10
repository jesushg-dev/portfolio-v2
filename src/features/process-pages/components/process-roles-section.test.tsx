import { render, screen } from "@testing-library/react";
import { ProcessRolesSection } from "./process-roles-section";

jest.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

describe("ProcessRolesSection", () => {
  const baseProps = {
    eyebrow: "Roles",
    title: "Where I fit in",
    description: "Engineering collaboration description",
    myRolesLabel: "My roles",
    myRoles: ["Full-Stack Developer", "Software Architect"],
    ecosystemRoles: ["QA Engineer", "Product Manager"],
    testingLabel: "Testing I bring",
    testingTags: ["Unit Testing", "E2E Testing"],
  };

  it("renders with custom ecosystemRolesLabel", () => {
    render(
      <ProcessRolesSection
        {...baseProps}
        ecosystemRolesLabel="I collaborate with"
      />,
    );

    expect(screen.getByText("I collaborate with")).toBeInTheDocument();
    expect(screen.getByText("My roles")).toBeInTheDocument();
    expect(screen.getByText("Full-Stack Developer")).toBeInTheDocument();
    expect(screen.getByText("QA Engineer")).toBeInTheDocument();
    expect(screen.getByText("Unit Testing")).toBeInTheDocument();
  });

  it("falls back to default label when ecosystemRolesLabel is omitted", () => {
    render(<ProcessRolesSection {...baseProps} />);

    expect(screen.getByText("I collaborate with")).toBeInTheDocument();
  });

  it("renders localized ecosystemRolesLabel when provided", () => {
    render(
      <ProcessRolesSection
        {...baseProps}
        ecosystemRolesLabel="Ik werk samen met"
      />,
    );

    expect(screen.getByText("Ik werk samen met")).toBeInTheDocument();
  });
});
