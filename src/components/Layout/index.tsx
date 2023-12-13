import React, { FC } from 'react';

import Footer from './Footer';
import Header from './Header';
import ScrollToTop from '../UI/ScrollToTop';

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
