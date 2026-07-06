"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";

interface ICvListItemActionsProps {
  isEditing: boolean;
  onEditToggle: () => void;
  onDelete: () => void;
}

const CvListItemActions: FC<ICvListItemActionsProps> = ({
  isEditing,
  onEditToggle,
  onDelete,
}) => {
  const t = useTranslations("admin.actions");

  return (
    <div className="flex shrink-0 gap-3">
      <button
        type="button"
        onClick={onEditToggle}
        className="hover:text-primary-700 text-xs font-medium text-gray-500 transition-colors"
      >
        {isEditing ? t("cancel") : t("edit")}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="text-xs font-medium text-gray-500 transition-colors hover:text-red-600"
      >
        {t("delete")}
      </button>
    </div>
  );
};

export default CvListItemActions;
