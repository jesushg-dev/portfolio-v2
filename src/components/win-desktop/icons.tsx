/* eslint-disable import/no-restricted-paths */
import { type ComponentType } from "react";
import About from "@/features/home/components/about";
import Portfolio from "@/features/home/components/portfolio";
import ContactForm from "@/features/home/components/contact/contact-form";

import type { ITaskbarIcon } from "./task-bar/task-bar-icons";

interface ITaskbarIconComponentProps extends Omit<
  ITaskbarIcon,
  "onClick" | "isActive" | "size"
> {
  id: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  size?: { width: number; height: number };
  skipTaskbar?: boolean;
}

const icons: ITaskbarIconComponentProps[] = [
  {
    id: "about",
    icon: "https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-about-me-96_x6fa0e.webp",
    component: About,
    size: { width: 1150, height: 570 },
    title: "About Me",
  },
  {
    id: "contact",
    icon: "https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-mail-96_upmhx3.webp",
    component: ContactForm,
    size: { width: 550, height: 570 },
    title: "Contact Me",
  },
  {
    id: "portfolio",
    icon: "https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-portfolio-96_opfju0.webp",
    component: Portfolio,
    size: { width: 950, height: 570 },
    title: "Portfolio",
  },
  /*  
  {
    id: 'blog',
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-rss-96_wxhdyp.webp',
    label: 'Blog',
    component: () => {
      return (
        <div>
          Blog
          <p>Coming Soon</p>
        </div>
      );
    },
    size: { width: 800, height: 570 },
  },  
  */
];

export default icons;
