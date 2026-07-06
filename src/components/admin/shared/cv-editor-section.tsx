import type { FC, ReactNode } from "react";

interface ICvEditorSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

const CvEditorSection: FC<ICvEditorSectionProps> = ({
  id,
  title,
  children,
}) => (
  <section id={id} className="bg-card scroll-mt-24 rounded-xl p-6 shadow-sm">
    <h2 className="text-foreground mb-5 pb-3 text-base font-semibold">
      {title}
    </h2>
    {children}
  </section>
);

export default CvEditorSection;
