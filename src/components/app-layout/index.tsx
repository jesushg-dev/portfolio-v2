import { type ReactNode } from "react";
import type { FC } from "react";

import Footer from "./app-footer";
import Header from "./app-header";
import ScrollToTopLazy from "../custom-ui/scroll-to-top-lazy";

interface ILayoutProps {
  children: ReactNode;
  headerAlwaysVisible?: boolean;
}

const Layout: FC<ILayoutProps> = ({ children, headerAlwaysVisible }) => {
  return (
    <>
      <Header alwaysVisible={headerAlwaysVisible} />
      <main
        id="main-content"
        className="flex min-h-screen flex-col justify-between"
      >
        {children}
        <ScrollToTopLazy />
      </main>
      <Footer />
    </>
  );
};

export default Layout;
