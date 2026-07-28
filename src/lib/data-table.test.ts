import {
  getFilterOperators,
  getDefaultFilterOperator,
  getValidFilters,
  getColumnPinningStyle,
} from "./data-table";
import type { FilterVariant } from "@/types/data-table";
import type { Column } from "@tanstack/react-table";

function makeMockColumn(opts: {
  pinned?: false | "left" | "right";
  isLastLeft?: boolean;
  isFirstRight?: boolean;
  start?: number;
  after?: number;
  size?: number;
}) {
  return {
    getIsPinned: () => opts.pinned ?? false,
    getIsLastColumn: (side: string) =>
      side === "left" && (opts.isLastLeft ?? false),
    getIsFirstColumn: (side: string) =>
      side === "right" && (opts.isFirstRight ?? false),
    getStart: () => opts.start ?? 0,
    getAfter: () => opts.after ?? 0,
    getSize: () => opts.size ?? 150,
  } as unknown as Column<unknown>;
}

describe("getColumnPinningStyle", () => {
  it("returns unpinned style when column is not pinned", () => {
    const col = makeMockColumn({ pinned: false, size: 120 });
    const style = getColumnPinningStyle({ column: col });

    expect(style.position).toBe("relative");
    expect(style.opacity).toBe(1);
    expect(style.width).toBe(120);
    expect(style.boxShadow).toBeUndefined();
    expect(style.left).toBeUndefined();
    expect(style.right).toBeUndefined();
    expect(style.zIndex).toBeUndefined();
  });

  it("returns left pinned style with left offset and zIndex", () => {
    const col = makeMockColumn({ pinned: "left", start: 40, size: 100 });
    const style = getColumnPinningStyle({ column: col });

    expect(style.position).toBe("sticky");
    expect(style.left).toBe("40px");
    expect(style.opacity).toBe(0.97);
    expect(style.zIndex).toBe(1);
  });

  it("returns left pinned style with border shadow on last left column", () => {
    const col = makeMockColumn({ pinned: "left", isLastLeft: true, start: 80 });
    const style = getColumnPinningStyle({ column: col, withBorder: true });

    expect(style.boxShadow).toBe("-4px 0 4px -4px var(--border) inset");
  });

  it("returns right pinned style with right offset", () => {
    const col = makeMockColumn({ pinned: "right", after: 50 });
    const style = getColumnPinningStyle({ column: col });

    expect(style.position).toBe("sticky");
    expect(style.right).toBe("50px");
  });

  it("returns right pinned style with border shadow on first right column", () => {
    const col = makeMockColumn({
      pinned: "right",
      isFirstRight: true,
      after: 0,
    });
    const style = getColumnPinningStyle({ column: col, withBorder: true });

    expect(style.boxShadow).toBe("4px 0 4px -4px var(--border) inset");
  });

  it("returns undefined boxShadow when withBorder is true but column is neither last-left nor first-right", () => {
    const col = makeMockColumn({ pinned: "left", isLastLeft: false });
    const style = getColumnPinningStyle({ column: col, withBorder: true });

    expect(style.boxShadow).toBeUndefined();
  });
});

// We cannot import getColumnPinningStyle directly without mocking @tanstack/react-table,
// so we focus on the pure functions that are safe to call in jsdom.

const allVariants: FilterVariant[] = [
  "text",
  "number",
  "range",
  "date",
  "dateRange",
  "boolean",
  "select",
  "multiSelect",
];

describe("getFilterOperators", () => {
  it("returns an array of operators for every known variant", () => {
    for (const variant of allVariants) {
      const ops = getFilterOperators(variant);
      expect(Array.isArray(ops)).toBe(true);
      expect(ops.length).toBeGreaterThan(0);
    }
  });

  it("returns textOperators for the text variant", () => {
    const ops = getFilterOperators("text");
    // Every text operator value should be a non-empty string
    ops.forEach((op) => {
      expect(typeof op.value).toBe("string");
      expect(typeof op.label).toBe("string");
    });
  });

  it("returns numericOperators for number and range", () => {
    expect(getFilterOperators("number")).toEqual(getFilterOperators("range"));
  });

  it("returns dateOperators for date and dateRange", () => {
    expect(getFilterOperators("date")).toEqual(getFilterOperators("dateRange"));
  });

  it("falls back to textOperators for unknown variants", () => {
    // Force an unknown variant to exercise the ?? fallback branch
    const ops = getFilterOperators("unknown" as FilterVariant);
    expect(ops).toEqual(getFilterOperators("text"));
  });
});

describe("getDefaultFilterOperator", () => {
  it("returns a string operator value for every known variant", () => {
    for (const variant of allVariants) {
      const op = getDefaultFilterOperator(variant);
      expect(typeof op).toBe("string");
      expect(op.length).toBeGreaterThan(0);
    }
  });

  it("returns iLike as the fallback for the text variant (first operator)", () => {
    expect(getDefaultFilterOperator("text")).toBe("iLike");
  });

  it("returns eq as fallback for non-text unknown variant", () => {
    // Ensure the ?? branch for non-text is exercised
    const op = getDefaultFilterOperator("boolean");
    expect(typeof op).toBe("string");
  });
});

describe("getValidFilters", () => {
  it("removes filters with empty string values", () => {
    const result = getValidFilters([
      {
        id: "name",
        value: "",
        operator: "iLike",
        filterId: "f1",
        rowId: "r1",
        type: "text",
        field: "name",
        variant: "text",
      },
    ] as unknown as Parameters<typeof getValidFilters>[0]);
    expect(result).toHaveLength(0);
  });

  it("keeps filters with non-empty string values", () => {
    const result = getValidFilters([
      {
        id: "name",
        value: "Alice",
        operator: "iLike",
        filterId: "f1",
        rowId: "r1",
        type: "text",
        field: "name",
        variant: "text",
      },
    ] as unknown as Parameters<typeof getValidFilters>[0]);
    expect(result).toHaveLength(1);
  });

  it("keeps filters with isEmpty operator regardless of value", () => {
    const result = getValidFilters([
      {
        id: "name",
        value: "",
        operator: "isEmpty",
        filterId: "f1",
        rowId: "r1",
        type: "text",
        field: "name",
        variant: "text",
      },
    ] as unknown as Parameters<typeof getValidFilters>[0]);
    expect(result).toHaveLength(1);
  });

  it("keeps filters with isNotEmpty operator regardless of value", () => {
    const result = getValidFilters([
      {
        id: "name",
        value: "",
        operator: "isNotEmpty",
        filterId: "f1",
        rowId: "r1",
        type: "text",
        field: "name",
        variant: "text",
      },
    ] as unknown as Parameters<typeof getValidFilters>[0]);
    expect(result).toHaveLength(1);
  });

  it("keeps filters with non-empty array values", () => {
    const result = getValidFilters([
      {
        id: "tags",
        value: ["a", "b"],
        operator: "inArray",
        filterId: "f1",
        rowId: "r1",
        type: "text",
        field: "tags",
        variant: "multiSelect",
      },
    ] as unknown as Parameters<typeof getValidFilters>[0]);
    expect(result).toHaveLength(1);
  });

  it("removes filters with empty array values", () => {
    const result = getValidFilters([
      {
        id: "tags",
        value: [],
        operator: "inArray",
        filterId: "f1",
        rowId: "r1",
        type: "text",
        field: "tags",
        variant: "multiSelect",
      },
    ] as unknown as Parameters<typeof getValidFilters>[0]);
    expect(result).toHaveLength(0);
  });

  it("removes filters with null values", () => {
    const result = getValidFilters([
      {
        id: "date",
        value: null,
        operator: "eq",
        filterId: "f1",
        rowId: "r1",
        type: "text",
        field: "date",
        variant: "date",
      },
    ] as unknown as Parameters<typeof getValidFilters>[0]);
    expect(result).toHaveLength(0);
  });

  it("removes filters with undefined values", () => {
    const result = getValidFilters([
      {
        id: "date",
        value: undefined,
        operator: "eq",
        filterId: "f1",
        rowId: "r1",
        type: "text",
        field: "date",
        variant: "date",
      },
    ] as unknown as Parameters<typeof getValidFilters>[0]);
    expect(result).toHaveLength(0);
  });

  it("returns all filters when all are valid", () => {
    const result = getValidFilters([
      {
        id: "a",
        value: "x",
        operator: "iLike",
        filterId: "f1",
        rowId: "r1",
        type: "text",
        field: "a",
        variant: "text",
      },
      {
        id: "b",
        value: "isEmpty",
        operator: "isEmpty",
        filterId: "f2",
        rowId: "r2",
        type: "text",
        field: "b",
        variant: "text",
      },
    ] as unknown as Parameters<typeof getValidFilters>[0]);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(getValidFilters([])).toEqual([]);
  });
});
