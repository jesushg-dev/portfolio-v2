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
}) => {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="bg-card scroll-mt-24 rounded-xl p-6 shadow-sm"
    >
      <h2
        id={headingId}
        className="text-foreground mb-5 pb-3 text-base font-semibold"
      >
        {title}
      </h2>
      {children}
    </section>
  );
};

export default CvEditorSection;
