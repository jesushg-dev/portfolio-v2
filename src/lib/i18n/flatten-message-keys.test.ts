import {
  compareMessageKeySets,
  flattenMessageKeys,
} from "./flatten-message-keys";

describe("flatten-message-keys", () => {
  describe("flattenMessageKeys", () => {
    it("flattens nested object keys into dot-notation strings sorted alphabetically", () => {
      const input = {
        b: {
          two: "value2",
          one: "value1",
        },
        a: "valueA",
      };

      const result = flattenMessageKeys(input);
      expect(result).toEqual(["a", "b.one", "b.two"]);
    });

    it("handles primitives, nulls, arrays, and empty objects", () => {
      const input = {
        array: [1, 2, 3],
        nil: null,
        empty: {},
        str: "hello",
      };

      const result = flattenMessageKeys(input);
      expect(result).toEqual(["array", "nil", "str"]);
    });
  });

  describe("compareMessageKeySets", () => {
    it("returns missing and extra keys when comparing two key arrays", () => {
      const source = ["common", "onlyInSource"];
      const target = ["common", "onlyInTarget"];

      const diff = compareMessageKeySets(source, target);
      expect(diff).toEqual({
        missingInTarget: ["onlyInSource"],
        extraInTarget: ["onlyInTarget"],
      });
    });
  });
});
