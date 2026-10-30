import { fireEvent, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";

import { Form, FormField } from "@/components/ui/form";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import {
  CaseStudyContentSchema,
  type CaseStudyContentDTO,
} from "../lib/case-study";
import { CaseStudyNarrativeEditor } from "./case-study-narrative-editor";

function EditorHarness({
  value,
  onChange,
}: {
  value: CaseStudyContentDTO;
  onChange: (value: CaseStudyContentDTO) => void;
}) {
  const form = useForm({ defaultValues: { caseStudy: value } });
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="caseStudy"
        render={({ field }) => (
          <CaseStudyNarrativeEditor
            value={field.value}
            onBlur={field.onBlur}
            onChange={(next) => {
              field.onChange(next);
              onChange(next);
            }}
          />
        )}
      />
    </Form>
  );
}

it("edits section narrative without discarding gallery, metrics or other sections", () => {
  const value = CaseStudyContentSchema.parse({
    gallery: [{ image: "/preview.jpg" }],
    sections: [
      {
        key: "approach",
        kind: "CARDS",
        title: "Approach",
        lead: "Original choice",
      },
      {
        key: "results",
        kind: "METRICS",
        title: "Results",
        items: [{ key: "users", value: "100" }],
      },
    ],
  });
  const onChange = jest.fn<void, [CaseStudyContentDTO]>();
  renderWithIntl(<EditorHarness value={value} onChange={onChange} />);
  fireEvent.change(screen.getAllByLabelText("Section introduction")[0], {
    target: { value: "Updated choice" },
  });
  const edited = onChange.mock.lastCall?.[0];
  expect(edited?.sections[0]?.lead).toBe("Updated choice");
  expect(edited?.sections[1]).toEqual(value.sections[1]);
  expect(edited?.gallery).toEqual(value.gallery);
  fireEvent.click(screen.getByRole("button", { name: "Add section" }));
  expect(onChange.mock.lastCall?.[0].sections).toHaveLength(3);
});
