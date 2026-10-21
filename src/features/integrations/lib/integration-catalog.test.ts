import { INTEGRATION_CATALOG } from "./integration-catalog";
import { INTEGRATION_PROVIDERS } from "./integration-paths";

describe("INTEGRATION_CATALOG", () => {
  it("covers every provider exactly once", () => {
    const ids = INTEGRATION_CATALOG.map((item) => item.id);
    expect(ids.sort()).toEqual([...INTEGRATION_PROVIDERS].sort());
  });
});
