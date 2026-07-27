import { renderHook, act } from "@testing-library/react";
import usePopover from "./use-popover";

describe("usePopover hook", () => {
  it("defaults to uncontrolled closed state", () => {
    const { result } = renderHook(() => usePopover());
    expect(result.current.open).toBe(false);
  });

  it("supports initialOpen option for uncontrolled state", () => {
    const { result } = renderHook(() => usePopover({ initialOpen: true }));
    expect(result.current.open).toBe(true);

    act(() => {
      result.current.setOpen(false);
    });
    expect(result.current.open).toBe(false);
  });

  it("supports controlled mode with open and onOpenChange", () => {
    const onOpenChange = jest.fn();
    const { result } = renderHook(() =>
      usePopover({ open: true, onOpenChange }),
    );

    expect(result.current.open).toBe(true);

    act(() => {
      result.current.setOpen(false);
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("allows setting labelId and descriptionId", () => {
    const { result } = renderHook(() => usePopover());

    act(() => {
      result.current.setLabelId("label-123");
      result.current.setDescriptionId("desc-456");
    });

    expect(result.current.labelId).toBe("label-123");
    expect(result.current.descriptionId).toBe("desc-456");
  });
});
