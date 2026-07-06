import { type ReactNode } from "react";
import type { FC } from "react";

import Footer from "./app-footer";
import Header from "./app-header";
import ScrollToTop from "../custom-ui/scroll-to-top";

interface ILayoutProps {
  children: ReactNode;
  headerAlwaysVisible?: boolean;
}

const Layout: FC<ILayoutProps> = ({ children, headerAlwaysVisible }) => {
  return (
    <>
      <Header alwaysVisible={headerAlwaysVisible} />
      <div className="flex min-h-screen flex-col justify-between">
        {children}
        <ScrollToTop />
      </div>
      <Footer />
    </>
  );
};

export default Layout;
