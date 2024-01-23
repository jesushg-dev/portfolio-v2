import type { FC } from "react";

type NotificationHeaderProps = {
  iconPath: string;
  text: string;
};

const NotificationHeader: FC<NotificationHeaderProps> = ({
  iconPath,
  text,
}) => (
  <div className="text-center">
    <h2 className="flex items-center justify-center space-x-1 text-sm font-medium">
      <svg
        className="inline-block h-5 w-5 opacity-50"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d={iconPath}
        />
      </svg>
      <span>{text}</span>
    </h2>
  </div>
);

export default NotificationHeader;
