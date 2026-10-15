import type { FC } from "react";
import { getTranslations } from "next-intl/server";
import { User } from "lucide-react";

const HeroEmpty: FC = async () => {
  const t = await getTranslations("main.heroMain.empty");

  return (
    <section
      id="home"
      className="bg-card text-card-foreground relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 pt-28"
    >
      <div className="border-border/80 bg-muted/40 z-10 flex max-w-lg flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-10 text-center backdrop-blur-xs">
        <User className="text-muted-foreground size-12" />
        <p className="text-foreground text-lg font-semibold">{t("title")}</p>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
    </section>
  );
};

export default HeroEmpty;
