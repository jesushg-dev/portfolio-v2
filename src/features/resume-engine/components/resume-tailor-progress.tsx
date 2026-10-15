"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ResumeTailorProgressProps {
  embedded?: boolean;
}

export const ResumeTailorProgress: FC<ResumeTailorProgressProps> = ({
  embedded = false,
}) => {
  const t = useTranslations("admin.resumeStudio");

  const content = (
    <div
      className={cn(
        "flex flex-col items-center gap-3",
        embedded ? "py-8" : "py-12",
      )}
    >
      <Loader2
        className={cn(
          "text-primary animate-spin",
          embedded ? "size-8" : "size-10",
        )}
      />
      <p className="text-foreground text-sm font-medium">
        {t("tailoringTitle")}
      </p>
      <p className="text-muted-foreground text-center text-xs">
        {t("tailoringDescription")}
      </p>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card className="bg-card text-card-foreground">
      <CardContent>{content}</CardContent>
    </Card>
  );
};
