"use client";
import { useTranslations } from "next-intl";
import {
  AdminFormLanguageBar,
  type LanguageProgress,
} from "./admin-form-language-bar";
interface Props {
  languages: LanguageProgress[];
  activeLangId: string;
  onSelectLang: (id: string) => void;
}
export function LocalizedFormLanguageBar(props: Props) {
  const t = useTranslations("admin.forms.languageBar");
  return (
    <AdminFormLanguageBar
      {...props}
      baseLabel={t("base")}
      allCompleteText={t("complete")}
      completeProgressText={(done, total) => t("progress", { done, total })}
      missingFieldsText={(fields) => t("missing", { fields })}
    />
  );
}
