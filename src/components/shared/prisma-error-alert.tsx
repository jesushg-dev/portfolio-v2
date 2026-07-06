import { type FC } from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Shape of the embedded Prisma error
interface PrismaErrorShape {
  prisma: true;
  code: string;
  message: string;
  meta?: Record<string, unknown>;
}

// Helper to see if something is a plain object
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Extract a Prisma error from either `error` directly or `error.info`
export function extractPrismaError(error: unknown): PrismaErrorShape | null {
  if (!isObject(error)) {
    return null;
  }

  // If the top-level error already has the Prisma shape
  if (
    error.prisma === true &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  ) {
    return error as unknown as PrismaErrorShape;
  }

  // If the error has an `info` property with the Prisma shape
  if (isObject(error.info) && error.info.prisma === true) {
    const info = error.info;
    if (typeof info.code === "string" && typeof info.message === "string") {
      return info as unknown as PrismaErrorShape;
    }
  }

  return null;
}

function getErrorMessage(error: unknown): {
  title: string;
  description: string;
} {
  const prismaError = extractPrismaError(error);

  // If it's recognized as a Prisma error
  if (prismaError) {
    const fallbackMessage =
      prismaError.message.split("\n").pop() ?? "Unknown database error";

    // Handle specific Prisma error codes
    if (prismaError.code === "P2002") {
      const match = /Unique constraint failed on the constraint: `([^`]+)`/.exec(prismaError.message);
      const target = prismaError.meta?.target;
      const targetStr = Array.isArray(target) ? target.join(", ") : typeof target === "string" ? target : null;
      const constraint = match?.[1] ?? targetStr ?? "unknown field";
      return {
        title: "Database Error",
        description: `Unique constraint failed: ${constraint}`,
      };
    }

    const errorMap: Record<string, string> = {
      P2025: "Record not found",
      P2003: "Foreign key constraint failed",
      P2016: "Query interpretation error",
      P2021: "Table does not exist",
      P2014: "Related record cannot be changed",
    };

    return {
      title: "Database Error",
      description: errorMap[prismaError.code] ?? fallbackMessage,
    };
  }

  // If it's a regular JS error
  if (error instanceof Error) {
    return {
      title: "Error",
      description: error.message,
    };
  }

  // Fallback
  return {
    title: "Error",
    description: "An unexpected error occurred",
  };
}

interface PrismaErrorAlertProps {
  error: unknown;
}

export const PrismaErrorAlert: FC<PrismaErrorAlertProps> = ({ error }) => {
  const { title, description } = getErrorMessage(error);

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
};
