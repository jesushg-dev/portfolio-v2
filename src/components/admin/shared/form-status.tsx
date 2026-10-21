"use client";

import type { FC } from "react";

interface IFormStatusProps {
  error?: string | null;
  success?: boolean;
  successMessage?: string;
}

const FormStatus: FC<IFormStatusProps> = ({
  error,
  success,
  successMessage = "Saved.",
}) => {
  if (!error && !success) return null;
  return (
    <div className="flex flex-col gap-2">
      {error ? (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          role="status"
          className="bg-primary/10 text-primary rounded-md px-3 py-2 text-sm"
        >
          {successMessage}
        </p>
      ) : null}
    </div>
  );
};

export default FormStatus;
