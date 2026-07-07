import type { FC, ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
}

const AuthShell: FC<AuthShellProps> = ({ children }) => {
  return (
    <div className="bg-muted flex min-h-screen w-full items-center justify-center">
      <div className="w-full [--radius:0.5rem]">
        <div className="flex min-h-full w-full items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
