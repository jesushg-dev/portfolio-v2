import About from "../Home/About";
import Portfolio from "../Home/Portfolio";
import CurriculumVitae from "../CurriculumVitae";
import ContactForm from "../Home/Contact/ContactForm";

import type { ITaskbarIcon } from "./TaskBar/TaskBarIcons";

interface ITaskbarIconComponentProps
  extends Omit<ITaskbarIcon, "onClick" | "isActive" | "size"> {
  id: string;
  title: string;
  component: React.ComponentType<any>;
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
  {
    id: "resume",
    icon: "https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-resume-96-alt_wcl4bp.webp",
    component: CurriculumVitae,
    size: { width: 720, height: 570 },
    title: "Resume",
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
