import type { FC } from "react";

interface IPageHeaderProps {
  title: string;
  description?: string;
}

const PageHeader: FC<IPageHeaderProps> = ({ title, description }) => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    {description ? (
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    ) : null}
  </div>
);

export default PageHeader;
