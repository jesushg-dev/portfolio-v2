"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";

import { buildContributionYear, contribCellClass } from "../lib/contrib-year";

interface NowContribGraphProps {
  totalLabel: string;
  lessLabel: string;
  moreLabel: string;
}

export function NowContribGraph({
  totalLabel,
  lessLabel,
  moreLabel,
}: NowContribGraphProps) {
  const locale = useLocale();
  const { cells } = useMemo(() => buildContributionYear(locale), [locale]);
  const monthMarks = cells.filter((c) => c.monthLabel);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <span className="text-muted-foreground text-xs font-semibold">
          {totalLabel}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div
          className="mb-1 grid gap-[3px]"
          style={{ gridTemplateColumns: "repeat(53, 10px)" }}
        >
          {monthMarks.map((mark) => (
            <span
              key={`${mark.key}-m`}
              className="text-muted-foreground text-[10px]"
              style={{ gridColumn: mark.week + 1 }}
            >
              {mark.monthLabel}
            </span>
          ))}
        </div>
        <div
          className="inline-grid gap-[3px]"
          style={{
            gridAutoFlow: "column",
            gridAutoColumns: "10px",
            gridTemplateRows: "repeat(7, 10px)",
          }}
        >
          {cells.map((cell) => (
            <div
              key={cell.key}
              title={cell.title}
              className={contribCellClass(cell.level)}
            />
          ))}
        </div>
      </div>

      <div className="text-muted-foreground mt-3 flex items-center justify-end gap-1.5 text-[11px]">
        <span>{lessLabel}</span>
        <span className="bg-border size-2.5 rounded-[2px]" />
        <span className="bg-primary/20 size-2.5 rounded-[2px]" />
        <span className="bg-primary/45 size-2.5 rounded-[2px]" />
        <span className="bg-primary/70 size-2.5 rounded-[2px]" />
        <span className="bg-primary size-2.5 rounded-[2px]" />
        <span>{moreLabel}</span>
      </div>
    </div>
  );
}
