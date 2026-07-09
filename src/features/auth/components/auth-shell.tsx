import type { FC, ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
}

const AuthShell: FC<AuthShellProps> = ({ children }) => {
  return (
    <div className="bg-background text-foreground min-h-screen w-full">
      {children}
    </div>
  );
};

export default AuthShell;
