import type { FC } from "react";
import React from "react";

import ScrollToTop from "../UI/ScrollToTop";

import Footer from "./Footer";
import Header from "./Header";

interface ILayoutProps {
  children: React.ReactNode;
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
