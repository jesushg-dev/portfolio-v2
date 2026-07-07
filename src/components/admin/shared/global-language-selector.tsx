import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export interface GlobalLanguageSelectorProps {
  languages: { id: string; name: string; code: string }[];
  activeLangId: string;
  onLangChange: (id: string) => void;
}

export function GlobalLanguageSelector({
  languages,
  activeLangId,
  onLangChange,
}: GlobalLanguageSelectorProps) {
  const t = useTranslations("admin.forms");

  if (!languages || languages.length === 0) return null;

  return (
    <div className="bg-muted/30 border-border/50 mb-6 flex items-center gap-3 rounded-lg border p-2">
      <div className="text-muted-foreground flex items-center gap-2 px-2">
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">{t("editingLanguage")}</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto">
        {languages.map((lang) => {
          const isActive = activeLangId === lang.id;
          return (
            <Button
              key={lang.id}
              type="button"
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onLangChange(lang.id)}
              className={`h-8 rounded-md px-3 transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {lang.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
