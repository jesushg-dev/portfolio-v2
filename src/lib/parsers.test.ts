import { getFiltersStateParser, getSortingStateParser } from "./parsers";

jest.mock("nuqs/server", () => ({
  createParser: (options: unknown) => options,
}));

describe("parsers", () => {
  describe("getSortingStateParser", () => {
    it("parses valid JSON sorting state", () => {
      const parser = getSortingStateParser();
      const input = JSON.stringify([{ id: "title", desc: true }]);
      const parsed = parser.parse(input);
      expect(parsed).toEqual([{ id: "title", desc: true }]);

      expect(parser.serialize(parsed!)).toBe(input);
    });

    it("handles validKeys set or array filter", () => {
      const parserArray = getSortingStateParser(["title"]);
      expect(
        parserArray.parse(JSON.stringify([{ id: "title", desc: false }])),
      ).toEqual([{ id: "title", desc: false }]);
      expect(
        parserArray.parse(JSON.stringify([{ id: "unknown", desc: false }])),
      ).toBeNull();

      const parserSet = getSortingStateParser(new Set(["title"]));
      expect(
        parserSet.parse(JSON.stringify([{ id: "title", desc: false }])),
      ).toEqual([{ id: "title", desc: false }]);
      expect(
        parserSet.parse(JSON.stringify([{ id: "other", desc: false }])),
      ).toBeNull();
    });

    it("returns null for invalid JSON or invalid schema", () => {
      const parser = getSortingStateParser();
      expect(parser.parse("not-json")).toBeNull();
      expect(parser.parse(JSON.stringify({ not: "an array" }))).toBeNull();
    });

    it("compares equality with eq method", () => {
      const parser = getSortingStateParser();
      const a = [{ id: "title", desc: true }];
      const b = [{ id: "title", desc: true }];
      const c = [{ id: "title", desc: false }];

      expect(
        parser.eq(
          a as unknown as Parameters<typeof parser.eq>[0],
          b as unknown as Parameters<typeof parser.eq>[0],
        ),
      ).toBe(true);
      expect(
        parser.eq(
          a as unknown as Parameters<typeof parser.eq>[0],
          c as unknown as Parameters<typeof parser.eq>[0],
        ),
      ).toBe(false);
    });
  });

  describe("getFiltersStateParser", () => {
    it("parses valid JSON filter state", () => {
      const parser = getFiltersStateParser();
      const filterItem = {
        id: "title",
        value: "hello",
        variant: "text",
        operator: "iLike",
        filterId: "title",
      };
      const input = JSON.stringify([filterItem]);
      const parsed = parser.parse(input);
      expect(parsed).toEqual([filterItem]);
      expect(parser.serialize(parsed!)).toBe(input);
    });

    it("filters invalid column keys when validKeys is supplied", () => {
      const parserArray = getFiltersStateParser(["title"]);
      const valid = {
        id: "title",
        value: "hello",
        variant: "text",
        operator: "iLike",
        filterId: "title",
      };
      const invalid = {
        id: "category",
        value: "WORK",
        variant: "text",
        operator: "iLike",
        filterId: "category",
      };

      expect(parserArray.parse(JSON.stringify([valid]))).toEqual([valid]);
      expect(parserArray.parse(JSON.stringify([invalid]))).toBeNull();

      const parserSet = getFiltersStateParser(new Set(["title"]));
      expect(parserSet.parse(JSON.stringify([valid]))).toEqual([valid]);
      expect(parserSet.parse(JSON.stringify([invalid]))).toBeNull();
    });

    it("returns null for invalid JSON or schema error", () => {
      const parser = getFiltersStateParser();
      expect(parser.parse("{bad")).toBeNull();
      expect(parser.parse(JSON.stringify([{ invalid: "item" }]))).toBeNull();
    });

    it("compares equality with eq method", () => {
      const parser = getFiltersStateParser();
      const f1 = [
        {
          id: "title",
          value: "a",
          variant: "text" as const,
          operator: "iLike" as const,
          filterId: "f1",
        },
      ];
      const f2 = [
        {
          id: "title",
          value: "a",
          variant: "text" as const,
          operator: "iLike" as const,
          filterId: "f1",
        },
      ];
      const f3 = [
        {
          id: "title",
          value: "b",
          variant: "text" as const,
          operator: "iLike" as const,
          filterId: "f1",
        },
      ];

      expect(
        parser.eq(
          f1 as unknown as Parameters<typeof parser.eq>[0],
          f2 as unknown as Parameters<typeof parser.eq>[0],
        ),
      ).toBe(true);
      expect(
        parser.eq(
          f1 as unknown as Parameters<typeof parser.eq>[0],
          f3 as unknown as Parameters<typeof parser.eq>[0],
        ),
      ).toBe(false);
    });
  });
});
