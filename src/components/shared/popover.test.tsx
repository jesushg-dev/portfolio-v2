import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import Popover, {
  PopoverTrigger,
  PopoverContent,
  PopoverHeading,
  PopoverDescription,
  PopoverClose,
} from "./popover";

describe("Popover compound components", () => {
  it("renders trigger button and open content when initialOpen is true", () => {
    render(
      <Popover initialOpen={true}>
        <PopoverTrigger>Toggle Popover</PopoverTrigger>
        <PopoverContent>
          <PopoverHeading>Title</PopoverHeading>
          <PopoverDescription>Description text</PopoverDescription>
          <PopoverClose data-testid="close-btn">Close</PopoverClose>
        </PopoverContent>
      </Popover>
    );

    expect(screen.getByRole("button", { name: "Toggle Popover", hidden: true })).toHaveAttribute("data-state", "open");
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("returns null for PopoverContent when popover is closed", () => {
    render(
      <Popover initialOpen={false}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Hidden Content</PopoverContent>
      </Popover>
    );

    expect(screen.queryByText("Hidden Content")).toBeNull();
  });

  it("handles asChild on PopoverTrigger", () => {
    render(
      <Popover initialOpen={true}>
        <PopoverTrigger asChild={true}>
          <a href="#link">Custom Anchor</a>
        </PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    expect(screen.getByRole("link", { name: "Custom Anchor", hidden: true })).toBeInTheDocument();
  });

  it("closes popover when PopoverClose is clicked and calls custom onClick", () => {
    const customClick = jest.fn();
    render(
      <Popover initialOpen={true}>
        <PopoverContent>
          <PopoverClose onClick={customClick}>Close Now</PopoverClose>
        </PopoverContent>
      </Popover>
    );

    const closeBtn = screen.getByRole("button", { name: "Close Now" });
    fireEvent.click(closeBtn);
    expect(customClick).toHaveBeenCalled();
  });
});
