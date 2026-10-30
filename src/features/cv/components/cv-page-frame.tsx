import type { FC, ReactNode } from "react";
import { cvPreviewFont } from "@/features/cv/lib/cv-preview-font";

interface CvPageFrameProps {
  hint?: ReactNode;
  children: ReactNode;
}

/** Centers CV content at letter width to match the public curriculum page. */
export const CvPageFrame: FC<CvPageFrameProps> = ({ hint, children }) => {
  return (
    <div className="mx-auto w-full max-w-[51rem]">
      {hint ? (
        <div className="border-border/70 bg-card text-muted-foreground mb-4 rounded-xl border px-4 py-2 text-xs shadow-2xs">
          {hint}
        </div>
      ) : null}
      {/* CV paper sheet matching public /curriculum-vitae */}
      <div
        className={`${cvPreviewFont.variable} ${cvPreviewFont.className} cv-docx-font overflow-hidden bg-white text-slate-900 shadow-[0_1.875rem_4.375rem_-1.875rem_rgba(10,61,122,0.45)] md:rounded-2xl`}
      >
        {children}
      </div>
    </div>
  );
};
