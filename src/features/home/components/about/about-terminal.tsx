import type { FC } from "react";

import { Terminal } from "@/components/ui/terminal";
import type { TerminalDisplayDTO } from "@/features/terminal/lib/types";

interface Props {
  data?: TerminalDisplayDTO | null;
}

const AboutTerminal: FC<Props> = ({ data }) => {
  if (!data) return null;

  return (
    <Terminal
      username={data.username}
      commands={data.commands}
      outputs={data.outputs}
      typingSpeed={data.typingSpeed}
      delayBetweenCommands={data.delayBetweenCommands}
      enableSound={false}
      className="px-0"
    />
  );
};

export default AboutTerminal;
