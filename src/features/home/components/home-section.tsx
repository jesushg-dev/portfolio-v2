import type { ReactNode } from "react";

interface HomeSectionProps {
  children: ReactNode;
  id?: string;
  estimatedHeight?: `${number}rem`;
}

/** Keep content in the static HTML while deferring offscreen layout and paint. */
export default function HomeSection({
  children,
  id,
  estimatedHeight = "32rem",
}: HomeSectionProps) {
  return (
    <div
      id={id}
      className="[content-visibility:auto] print:[content-visibility:visible]"
      style={{ containIntrinsicSize: `auto ${estimatedHeight}` }}
    >
      {children}
    </div>
  );
}
