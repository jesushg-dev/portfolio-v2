import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { VacancySkillConfirmation } from "./vacancy-skill-confirmation";

it("leaves new technologies unchecked and allows an unlisted name copied from the vacancy", () => {
  const onChange = jest.fn();
  renderWithIntl(
    <VacancySkillConfirmation
      vacancy="Stack: MVC, ASP.NET Core, React, APIs REST. We also use quiet oak."
      declared={["React", "REST APIs"]}
      confirmed={[]}
      suggestions={[]}
      onChange={onChange}
    />,
  );
  const mvc = screen.getByRole("checkbox", { name: "MVC" });
  expect(
    screen.queryByRole("checkbox", { name: "APIs REST" }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "apis rest" },
  });
  expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  expect(mvc).not.toBeChecked();
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(mvc);
  expect(onChange).toHaveBeenCalledWith(["MVC"]);
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "quiet oak" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  expect(onChange).toHaveBeenCalledWith(["quiet oak"]);
});

it("applies saved equivalences automatically and lets the user remove them", () => {
  const onRemove = jest.fn();
  renderWithIntl(
    <VacancySkillConfirmation
      vacancy="Stack: MVC, RESTful APIs."
      declared={["REST APIs"]}
      confirmed={[]}
      savedEquivalences={[
        { id: "eq-1", original: "REST APIs", proposed: "RESTful APIs" },
      ]}
      suggestions={[]}
      onChange={jest.fn()}
      onRemoveSavedEquivalence={onRemove}
    />,
  );

  expect(
    screen.queryByRole("checkbox", { name: "RESTful APIs" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: "MVC" })).toBeInTheDocument();
  expect(screen.getByText("Saved equivalences (1)")).toBeVisible();

  fireEvent.click(
    screen.getByRole("button", {
      name: "Remove saved equivalence REST APIs → RESTful APIs",
    }),
  );
  expect(onRemove).toHaveBeenCalledWith("eq-1");
});
