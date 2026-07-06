import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
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
  if (!languages || languages.length === 0) return null;

  return (
    <div className="bg-muted/30 border-border/50 mb-6 flex items-center gap-3 rounded-lg border p-2">
      <div className="text-muted-foreground flex items-center gap-2 px-2">
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">Editing Language:</span>
      </div>
      <div
        role="tablist"
        aria-label="Editing language"
        className="flex items-center gap-1 overflow-x-auto"
      >
        {languages.map((lang) => {
          const isActive = activeLangId === lang.id;
          return (
            <Button
              key={lang.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onLangChange(lang.id)}
              className={cn(
                "h-8 rounded-md px-3 transition-colors",
                isActive && "shadow-sm",
              )}
            >
              {lang.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
