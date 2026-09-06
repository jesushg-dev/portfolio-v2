import { hardNavigate } from "./hard-navigate";

describe("hardNavigate", () => {
  it("assigns window.location", () => {
    const assign = jest.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, assign },
    });

    hardNavigate("/en/admin");
    expect(assign).toHaveBeenCalledWith("/en/admin");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: original,
    });
  });
});
