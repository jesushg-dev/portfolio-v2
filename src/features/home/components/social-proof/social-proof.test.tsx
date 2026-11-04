import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import SocialProof from "./index";

it("shows a manually controlled recommendation without repeated portfolio metrics", () => {
  renderWithIntl(
    <SocialProof
      testimonials={[
        {
          id: "one",
          author: "First colleague",
          quote: "Reliable engineering.",
          role: "Software engineer",
        },
        {
          id: "two",
          author: "Second colleague",
          quote: "Thoughtful collaboration.",
        },
      ]}
    />,
  );
  expect(screen.getByText("First colleague")).toBeInTheDocument();
  expect(screen.queryByText("Second colleague")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next recommendation" }));
  expect(screen.getByText("Second colleague")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Previous recommendation" }),
  );
  expect(screen.getByText("Software engineer")).toBeInTheDocument();
  expect(screen.queryByText("Projects")).not.toBeInTheDocument();
  expect(screen.queryByText("Years of experience")).not.toBeInTheDocument();
  expect(screen.getAllByRole("button")).toHaveLength(2);
});

it("renders full quoted content safely and rejects unsafe author links", () => {
  const quote =
    "<script>alert(1)</script> " +
    "Careful engineering and clear communication. ".repeat(12);
  const { container } = renderWithIntl(
    <SocialProof
      testimonials={[
        {
          id: "one",
          author: "Colleague",
          quote,
          linkedInUrl: "javascript:alert(1)",
        },
      ]}
    />,
  );
  expect(screen.getByText(quote.trim())).toBeInTheDocument();
  expect(container.querySelector("script")).toBeNull();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("hides the section when no recommendations are published", () => {
  const { container } = renderWithIntl(<SocialProof testimonials={[]} />);
  expect(container).toBeEmptyDOMElement();
});
