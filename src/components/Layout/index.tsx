import React, { FC } from 'react';
import Footer from './Footer';
import Header from './Header';

interface ILayoutProps {
  children: React.ReactNode;
  headerAlwaysVisible?: boolean;
}

const Layout: FC<ILayoutProps> = ({ children, headerAlwaysVisible }) => {
  return (
    <>
      <Header alwaysVisible={headerAlwaysVisible} />
      <div className="flex min-h-screen flex-col justify-between">{children}</div>
      <Footer />
    </>
  );
};

export default Layout;
