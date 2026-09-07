import { hardNavigate } from "./hard-navigate";

describe("hardNavigate", () => {
  it("is the full-page navigation helper used after auth", () => {
    expect(typeof hardNavigate).toBe("function");
  });
});
