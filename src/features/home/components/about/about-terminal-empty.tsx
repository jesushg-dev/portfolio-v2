import type { FC } from "react";
import { getTranslations } from "next-intl/server";
import { Terminal } from "lucide-react";

const AboutTerminalEmpty: FC = async () => {
  const t = await getTranslations("main.about.terminalEmpty");

  return (
    <div className="border-border bg-card text-card-foreground flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <Terminal className="text-muted-foreground h-10 w-10" />
      <p className="text-foreground text-sm font-medium">{t("title")}</p>
      <p className="text-muted-foreground max-w-sm text-sm">
        {t("description")}
      </p>
    </div>
  );
};

export default AboutTerminalEmpty;
