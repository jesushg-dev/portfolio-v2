import { type ReactNode } from "react";
import type { FC } from "react";

import Footer from "./app-footer";
import Header from "./app-header";
import ScrollToTopLazy from "../custom-ui/scroll-to-top-lazy";
import type { ProcessNavPage } from "@/lib/process-pages/process-nav-page";
import type { SiteBrand } from "@/lib/site-brand/site-brand";

interface ILayoutProps {
  children: ReactNode;
  cvPublic?: boolean;
  processNavPages?: ProcessNavPage[];
  siteBrand: SiteBrand;
}

const Layout: FC<ILayoutProps> = ({
  children,
  cvPublic = true,
  processNavPages = [],
  siteBrand,
}) => {
  return (
    <>
      <Header siteBrand={siteBrand} />
      <main
        id="main-content"
        className="flex min-h-screen flex-col justify-between"
      >
        {children}
        <ScrollToTopLazy />
      </main>
      <Footer
        cvPublic={cvPublic}
        processNavPages={processNavPages}
        siteBrand={siteBrand}
      />
    </>
  );
};

export default Layout;
