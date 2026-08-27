import type { FC, ReactNode } from "react";

interface CvPageFrameProps {
  hint?: ReactNode;
  children: ReactNode;
}

/** Centers CV content at letter width to match the public curriculum page. */
export const CvPageFrame: FC<CvPageFrameProps> = ({ hint, children }) => {
  return (
    <div className="max-w-letter mx-auto w-full">
      <div className="border-border overflow-hidden rounded-xl border shadow-sm">
        {hint ? (
          <p className="border-border/70 bg-muted/40 text-muted-foreground border-b px-4 py-2 text-xs">
            {hint}
          </p>
        ) : null}
        {/* CV paper is always light — body copy uses fixed dark hexes for print fidelity. */}
        <div className="bg-white text-black">{children}</div>
      </div>
    </div>
  );
};
