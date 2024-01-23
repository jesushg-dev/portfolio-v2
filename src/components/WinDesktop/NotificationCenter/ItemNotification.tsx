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
    className="block space-y-1 rounded bg-white bg-opacity-50 p-3 text-sm hover:bg-opacity-25 active:bg-opacity-50 dark:bg-black dark:bg-opacity-30 dark:hover:bg-opacity-50 dark:active:bg-opacity-30"
    href={href}
  >
    <h3 className="mb-1 font-medium">{title}</h3>
    <p className="leading-5 text-gray-700">{description}</p>
    <p className="text-gray-600">{date}</p>
  </a>
);

export default ItemNotification;
