import { renderHook } from "@testing-library/react";
import React from "react";
import PopoverContextProvider, { usePopoverContext } from "./popover-context-provider";

describe("PopoverContextProvider and usePopoverContext", () => {
  it("provides popover context value to children", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PopoverContextProvider>{children}</PopoverContextProvider>
    );

    const { result } = renderHook(() => usePopoverContext(), { wrapper });

    expect(result.current.open).toBeDefined();
    expect(result.current.setOpen).toBeDefined();
  });

  it("throws error when usePopoverContext is called outside PopoverContextProvider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => {
      renderHook(() => usePopoverContext());
    }).toThrow("Popover compound components cannot be rendered outside the Popover component");
    spy.mockRestore();
  });
});
