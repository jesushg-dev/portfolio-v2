import { appTableFeatures } from "./app-table-features";

describe("appTableFeatures", () => {
  it("registers table features used by admin data tables", () => {
    expect(appTableFeatures).toBeDefined();
  });
});
