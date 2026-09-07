import { dataTableParamsSchema } from "./data-table-schemas";

describe("dataTableParamsSchema", () => {
  it("defaults sort and filters to empty arrays", () => {
    expect(dataTableParamsSchema.parse({})).toEqual({
      sort: [],
      filters: [],
    });
  });

  it("accepts a paged query", () => {
    const parsed = dataTableParamsSchema.parse({
      page: 2,
      perPage: 25,
      sort: [{ id: "title", desc: true }],
      filters: [
        {
          id: "title",
          value: "React",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
      ],
    });
    expect(parsed.page).toBe(2);
    expect(parsed.filters[0]?.value).toBe("React");
  });
});
