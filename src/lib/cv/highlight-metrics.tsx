import type { FC } from "react";

/**
 * Highlights numeric achievements, percentages, and metrics (~25%, 7 a 4, 120+, +30 pp, 40%)
 * in bold without touching words like E2E.
 */
const METRIC_REGEX =
  /(?<![\w.])([+~]?\d+(?:[.,]\d+)?(?:\s?(?:%|pp))?\+?)(?![\w])/g;

interface HighlightMetricsProps {
  text: string;
}

export const HighlightMetrics: FC<HighlightMetricsProps> = ({ text }) => {
  const parts = text.split(METRIC_REGEX);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (/^[+~]?\d+(?:[.,]\d+)?(?:\s?(?:%|pp))?\+?$/.test(part)) {
          return (
            <strong key={index} className="font-bold text-slate-900">
              {part}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default HighlightMetrics;
