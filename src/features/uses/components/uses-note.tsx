import { Zap } from "lucide-react";

import { usesContainerClassName } from "./uses-layout";

interface UsesNoteProps {
  before: string;
  linkLabel: string;
  after: string;
}

export function UsesNote({ before, linkLabel, after }: UsesNoteProps) {
  return (
    <div className="px-4 pt-6 pb-16 sm:px-6 md:pt-8 md:pb-20 lg:px-20">
      <div
        className={`${usesContainerClassName} bg-primary/10 text-foreground flex items-center gap-3 rounded-xl px-6 py-5 text-sm`}
      >
        <Zap aria-hidden className="text-primary size-4 shrink-0" />
        <p>
          {before}{" "}
          <a
            href="https://uses.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-bold underline"
          >
            {linkLabel}
          </a>{" "}
          {after}
        </p>
      </div>
    </div>
  );
}
