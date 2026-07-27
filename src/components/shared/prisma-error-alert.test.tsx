import { render, screen } from "@testing-library/react";
import React from "react";
import { PrismaErrorAlert, extractPrismaError } from "./prisma-error-alert";

describe("extractPrismaError", () => {
  it("returns null for non-object values", () => {
    expect(extractPrismaError(null)).toBeNull();
    expect(extractPrismaError(undefined)).toBeNull();
    expect(extractPrismaError("string error")).toBeNull();
    expect(extractPrismaError(123)).toBeNull();
  });

  it("extracts Prisma error when top-level object has prisma: true", () => {
    const err = { prisma: true, code: "P2002", message: "Unique constraint" };
    expect(extractPrismaError(err)).toEqual(err);
  });

  it("extracts Prisma error when nested in error.info", () => {
    const err = {
      info: { prisma: true, code: "P2025", message: "Record not found" },
    };
    expect(extractPrismaError(err)).toEqual(err.info);
  });

  it("returns null if info is present but missing code or message", () => {
    const err = { info: { prisma: true, code: 123 } };
    expect(extractPrismaError(err)).toBeNull();
  });
});

describe("PrismaErrorAlert", () => {
  it("handles P2002 error code with regex constraint match", () => {
    const error = {
      prisma: true,
      code: "P2002",
      message: "Unique constraint failed on the constraint: `users_email_key`",
    };
    render(<PrismaErrorAlert error={error} />);
    expect(screen.getByText("Database Error")).toBeInTheDocument();
    expect(
      screen.getByText("Unique constraint failed: users_email_key"),
    ).toBeInTheDocument();
  });

  it("handles P2002 error code with target array in meta", () => {
    const error = {
      prisma: true,
      code: "P2002",
      message: "Unique constraint failed",
      meta: { target: ["email", "username"] },
    };
    render(<PrismaErrorAlert error={error} />);
    expect(
      screen.getByText("Unique constraint failed: email, username"),
    ).toBeInTheDocument();
  });

  it("handles P2002 error code with target string in meta", () => {
    const error = {
      prisma: true,
      code: "P2002",
      message: "Unique constraint failed",
      meta: { target: "email" },
    };
    render(<PrismaErrorAlert error={error} />);
    expect(
      screen.getByText("Unique constraint failed: email"),
    ).toBeInTheDocument();
  });

  it("handles P2002 error code without match or target (fallback constraint)", () => {
    const error = {
      prisma: true,
      code: "P2002",
      message: "Unique constraint failed",
    };
    render(<PrismaErrorAlert error={error} />);
    expect(
      screen.getByText("Unique constraint failed: unknown field"),
    ).toBeInTheDocument();
  });

  it("handles mapped Prisma error codes (P2025, P2003, P2016, P2021, P2014)", () => {
    const codesMap: Record<string, string> = {
      P2025: "Record not found",
      P2003: "Foreign key constraint failed",
      P2016: "Query interpretation error",
      P2021: "Table does not exist",
      P2014: "Related record cannot be changed",
    };

    for (const [code, expectedText] of Object.entries(codesMap)) {
      const { unmount } = render(
        <PrismaErrorAlert
          error={{ prisma: true, code, message: "Error msg" }}
        />,
      );
      expect(screen.getByText(expectedText)).toBeInTheDocument();
      unmount();
    }
  });

  it("handles unknown Prisma error code with fallbackMessage", () => {
    const error = {
      prisma: true,
      code: "P9999",
      message: "Custom DB Error\nDetailed message from DB",
    };
    render(<PrismaErrorAlert error={error} />);
    expect(screen.getByText("Detailed message from DB")).toBeInTheDocument();
  });

  it("handles regular JS Error instance", () => {
    render(<PrismaErrorAlert error={new Error("Standard JS Error")} />);
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Standard JS Error")).toBeInTheDocument();
  });

  it("handles non-error fallback values", () => {
    render(<PrismaErrorAlert error={null} />);
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(
      screen.getByText("An unexpected error occurred"),
    ).toBeInTheDocument();
  });
});
