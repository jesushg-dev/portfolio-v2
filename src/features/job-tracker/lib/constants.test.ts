import {
  KANBAN_COLUMNS,
  kanbanColumnStyles,
  statusVariants,
} from "./constants";

describe("job tracker constants", () => {
  it("covers every status in kanban columns and styles", () => {
    for (const status of KANBAN_COLUMNS) {
      expect(statusVariants[status]).toBeDefined();
      expect(kanbanColumnStyles[status].dot).toBeTruthy();
    }
  });
});
