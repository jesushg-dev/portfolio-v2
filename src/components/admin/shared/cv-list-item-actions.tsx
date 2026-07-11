"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ICvListItemActionsProps {
  isEditing: boolean;
  isDeleting?: boolean;
  isPending?: boolean;
  onEditToggle: () => void;
  onDelete: () => void;
}

const CvListItemActions: FC<ICvListItemActionsProps> = ({
  isEditing,
  isDeleting,
  isPending,
  onEditToggle,
  onDelete,
}) => {
  const t = useTranslations("admin.common");

  return (
    <div className="flex shrink-0 gap-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending ?? isDeleting}
        onClick={onEditToggle}
        className="text-muted-foreground hover:text-primary h-8 px-2 text-xs font-medium"
      >
        {isEditing ? t("cancel") : t("edit")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending ?? isDeleting}
        onClick={onDelete}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2 text-xs font-medium"
      >
        {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
        {t("delete")}
      </Button>
    </div>
  );
};

export default CvListItemActions;
