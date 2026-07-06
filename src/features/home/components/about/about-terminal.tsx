"use client";

import { useMemo, type FC } from "react";
import { useTranslations } from "next-intl";

import { Terminal } from "@/components/ui/terminal";

interface Props {
  consoleCode?: string | null;
}

const AboutTerminal: FC<Props> = ({ consoleCode }) => {
  const t = useTranslations("main.about");

  const { commands, outputs } = useMemo(() => {
    const profilePath = "~/profile.json";

    return {
      commands: ["whoami", `cat ${profilePath}`],
      outputs: {
        0: ["jesus"],
        1: consoleCode
          ? consoleCode.split("\n")
          : [
              "{",
              `  "${t("function.json.name")}": "Jesús Enmanuel Hernández González",`,
              `  "${t("function.json.languages")}": {`,
              `    "${t("function.language.spanish")}": "${t("function.languageLevel.native")}",`,
              `    "${t("function.language.english")}": "${t("function.languageLevel.advanced")}",`,
              `    "${t("function.language.dutch")}": "${t("function.languageLevel.basic")}"`,
              "  },",
              `  "${t("function.json.profession")}": "${t("function.profession")}"`,
              "}",
            ],
      },
    };
  }, [t, consoleCode]);

  return (
    <Terminal
      username="Jesus-Macbook"
      commands={commands}
      outputs={outputs}
      typingSpeed={45}
      delayBetweenCommands={1000}
      enableSound={false}
      className="px-0"
    />
  );
};

export default AboutTerminal;
