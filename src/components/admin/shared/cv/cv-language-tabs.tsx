import type { FC } from "react";
import { useCvEditorLocale } from "@/components/admin/shared/cv-editor-locale-context";
import LocaleSegment from "@/components/admin/shared/locale-segment";

const CvLanguageTabs: FC = () => {
  const localeCtx = useCvEditorLocale();
  if (!localeCtx) return null;
  return (
    <LocaleSegment
      id="cv-locale-tabs"
      buttonIdPrefix="cv-locale"
      value={localeCtx.editLocale}
      onChange={localeCtx.setEditLocale}
      defaultLocale={localeCtx.defaultLocale}
      size="sm"
    />
  );
};

export default CvLanguageTabs;
