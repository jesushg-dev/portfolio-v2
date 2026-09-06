import {
  appendWhereAnd,
  extractArrayFilter,
  extractStringFilter,
} from "./filter-utils";

describe("extractStringFilter", () => {
  it("returns undefined when filters are missing", () => {
    expect(extractStringFilter(undefined, "title")).toBeUndefined();
  });

  it("returns undefined when the id is not present", () => {
    expect(
      extractStringFilter(
        [
          {
            id: "type",
            value: "FRONTEND",
            variant: "select",
            operator: "eq",
            filterId: "f1",
          },
        ],
        "title",
      ),
    ).toBeUndefined();
  });

  it("returns a string value", () => {
    expect(
      extractStringFilter(
        [
          {
            id: "title",
            value: "React",
            variant: "text",
            operator: "iLike",
            filterId: "f1",
          },
        ],
        "title",
      ),
    ).toBe("React");
  });

  it("takes the first array element", () => {
    expect(
      extractStringFilter(
        [
          {
            id: "title",
            value: ["React", "Vue"],
            variant: "multiSelect",
            operator: "inArray",
            filterId: "f1",
          },
        ],
        "title",
      ),
    ).toBe("React");
  });

  it("ignores empty strings", () => {
    expect(
      extractStringFilter(
        [
          {
            id: "title",
            value: "",
            variant: "text",
            operator: "eq",
            filterId: "f1",
          },
        ],
        "title",
      ),
    ).toBeUndefined();
  });
});

describe("extractArrayFilter", () => {
  it("returns undefined when filters are missing", () => {
    expect(extractArrayFilter(undefined, "type")).toBeUndefined();
  });

  it("returns the array value", () => {
    expect(
      extractArrayFilter(
        [
          {
            id: "type",
            value: ["FRONTEND", "BACKEND"],
            variant: "multiSelect",
            operator: "inArray",
            filterId: "f1",
          },
        ],
        "type",
      ),
    ).toEqual(["FRONTEND", "BACKEND"]);
  });

  it("wraps a single string", () => {
    expect(
      extractArrayFilter(
        [
          {
            id: "type",
            value: "FRONTEND",
            variant: "select",
            operator: "eq",
            filterId: "f1",
          },
        ],
        "type",
      ),
    ).toEqual(["FRONTEND"]);
  });

  it("returns undefined for an empty array", () => {
    expect(
      extractArrayFilter(
        [
          {
            id: "type",
            value: [],
            variant: "multiSelect",
            operator: "inArray",
            filterId: "f1",
          },
        ],
        "type",
      ),
    ).toBeUndefined();
  });
});

describe("appendWhereAnd", () => {
  it("creates AND when none exists", () => {
    const where: { title?: string; AND?: unknown } = { title: "a" };
    appendWhereAnd(where, { title: "b" });
    expect(where.AND).toEqual([{ title: "b" }]);
  });

  it("wraps an existing single AND", () => {
    const where: { AND?: unknown } = { AND: { title: "a" } };
    appendWhereAnd(where, { title: "b" });
    expect(where.AND).toEqual([{ title: "a" }, { title: "b" }]);
  });

  it("appends to an existing AND array", () => {
    const where: { AND?: unknown } = { AND: [{ title: "a" }] };
    appendWhereAnd(where, { title: "b" });
    expect(where.AND).toEqual([{ title: "a" }, { title: "b" }]);
  });
});
