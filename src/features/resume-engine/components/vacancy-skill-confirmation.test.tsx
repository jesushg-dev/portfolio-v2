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
