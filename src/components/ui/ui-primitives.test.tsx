import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "./card";
import { Skeleton } from "./skeleton";

describe("Button component", () => {
  it("renders with default variant and size", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("data-slot", "button");
  });

  it("renders all button variants", () => {
    const variants = [
      "default",
      "outline",
      "secondary",
      "ghost",
      "destructive",
      "link",
    ] as const;
    for (const variant of variants) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole("button", { name: variant })).toBeInTheDocument();
      unmount();
    }
  });

  it("renders all button sizes", () => {
    const sizes = [
      "default",
      "xs",
      "sm",
      "lg",
      "icon",
      "icon-xs",
      "icon-sm",
      "icon-lg",
    ] as const;
    for (const size of sizes) {
      const { unmount } = render(<Button size={size}>Btn {size}</Button>);
      expect(
        screen.getByRole("button", { name: `Btn ${size}` }),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it("handles render and nativeButton props", () => {
    render(
      <Button
        render={(props) => (
          <a href="#custom" {...props}>
            Custom Link
          </a>
        )}
        nativeButton={true}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Custom Link" }),
    ).toBeInTheDocument();
  });
});

describe("Badge component", () => {
  it("renders default badge", () => {
    render(<Badge>Default Badge</Badge>);
    expect(screen.getByText("Default Badge")).toBeInTheDocument();
  });

  it("renders all badge variants", () => {
    const variants = [
      "default",
      "secondary",
      "destructive",
      "outline",
      "ghost",
      "link",
    ] as const;
    for (const variant of variants) {
      const { unmount } = render(
        <Badge variant={variant}>Badge {variant}</Badge>,
      );
      expect(screen.getByText(`Badge ${variant}`)).toBeInTheDocument();
      unmount();
    }
  });
});

describe("Card family components", () => {
  it("renders card with header, title, description, action, content, and footer", () => {
    render(
      <Card size="sm">
        <CardHeader>
          <CardTitle>Project Title</CardTitle>
          <CardDescription>Project Overview</CardDescription>
          <CardAction>
            <button>Edit</button>
          </CardAction>
        </CardHeader>
        <CardContent>Body details</CardContent>
        <CardFooter>Footer info</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Project Title")).toBeInTheDocument();
    expect(screen.getByText("Project Overview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByText("Body details")).toBeInTheDocument();
    expect(screen.getByText("Footer info")).toBeInTheDocument();
  });
});

describe("Skeleton component", () => {
  it("renders skeleton placeholder", () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    expect(container.firstChild).toHaveAttribute("data-slot", "skeleton");
  });
});
