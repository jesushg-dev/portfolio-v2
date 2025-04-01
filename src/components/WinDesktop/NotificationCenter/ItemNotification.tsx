import React from "react";
import type { FC } from "react";

// Define a type for the component props
type ItemNotificationProps = {
  href: string;
  date: string;
  title: string;
  description: string;
};

const ItemNotification: FC<ItemNotificationProps> = ({
  href,
  title,
  description,
  date,
}) => (
  <a
    className="block space-y-1 rounded-sm bg-white/50 p-3 text-sm hover:bg-white/25 active:bg-white/50 dark:bg-black/30 dark:hover:bg-black/50 dark:active:bg-black/30"
    href={href}
  >
    <h3 className="mb-1 font-medium">{title}</h3>
    <p className="leading-5 text-gray-700">{description}</p>
    <p className="text-gray-600">{date}</p>
  </a>
);

export default ItemNotification;
