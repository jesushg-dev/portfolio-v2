import type { FC } from "react";
import { getTranslations } from "next-intl/server";
import { User } from "lucide-react";

const HeroEmpty: FC = async () => {
  const t = await getTranslations("main.heroMain.empty");

  return (
    <section
      id="home"
      className="bg-background-900 text-secondaryText-50 relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 pt-28"
    >
      <div className="border-divider-300/50 bg-background-800/70 z-10 flex max-w-lg flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center backdrop-blur-sm">
        <User className="text-secondaryText-600 h-12 w-12" />
        <p className="text-secondaryText-50 text-lg font-medium">
          {t("title")}
        </p>
        <p className="text-secondaryText-600 text-sm">{t("description")}</p>
      </div>
    </section>
  );
};

export default HeroEmpty;
