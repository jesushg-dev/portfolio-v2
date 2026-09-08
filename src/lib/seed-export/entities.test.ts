import { SEED_EXPORT_ENTITIES, SEED_EXPORT_FILENAMES } from "./entities";

describe("seed export catalog", () => {
  it("has a filename for every entity", () => {
    for (const entity of SEED_EXPORT_ENTITIES) {
      expect(SEED_EXPORT_FILENAMES[entity]).toMatch(/\.json$/);
    }
  });
});
