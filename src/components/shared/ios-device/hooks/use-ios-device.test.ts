import { renderHook } from "@testing-library/react";
import { useIOSDevice } from "./use-ios-device";

describe("useIOSDevice", () => {
  it("returns default values when used outside provider", () => {
    const { result } = renderHook(() => useIOSDevice());
    expect(result.current.topBarHeight).toBe(38);
    expect(result.current.bottomHomeBarHeight).toBe(20);
    expect(result.current.isDeviceMockup).toBe(true);
    expect(typeof result.current.scrollToElement).toBe("function");
  });

  it("handles scrollToElement safely when element is null or has no scroll container", () => {
    const { result } = renderHook(() => useIOSDevice());
    expect(() => result.current.scrollToElement(null)).not.toThrow();

    const orphanElement = document.createElement("div");
    expect(() => result.current.scrollToElement(orphanElement)).not.toThrow();
  });

  it("scrolls closest container when scrollToElement is called", () => {
    const { result } = renderHook(() => useIOSDevice());
    const container = document.createElement("div");
    container.className = "overflow-y-auto";
    const element = document.createElement("div");
    container.appendChild(element);
    document.body.appendChild(container);

    container.scrollTo = jest.fn();
    const scrollToSpy = jest
      .spyOn(container, "scrollTo")
      .mockImplementation(() => undefined);

    jest.spyOn(container, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 400,
      left: 0,
      right: 300,
      width: 300,
      height: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    jest.spyOn(element, "getBoundingClientRect").mockReturnValue({
      top: 200,
      bottom: 240,
      left: 0,
      right: 300,
      width: 300,
      height: 40,
      x: 0,
      y: 200,
      toJSON: () => ({}),
    });

    result.current.scrollToElement(element, { block: "center" });

    expect(scrollToSpy).toHaveBeenCalled();

    document.body.removeChild(container);
  });
});
