import type { ReactNode } from "react";

interface ProfileLayoutProps {
  children?: ReactNode;
  tabs: ReactNode;
}

export default function ProfileLayout({ children, tabs }: ProfileLayoutProps) {
  return (
    <div>
      {tabs}
      {children}
    </div>
  );
}
