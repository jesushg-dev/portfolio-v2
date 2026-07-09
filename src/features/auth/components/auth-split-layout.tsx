import type { FC, ReactNode } from "react";

interface AuthSplitLayoutProps {
  form: ReactNode;
  showcase: ReactNode;
}

const AuthSplitLayout: FC<AuthSplitLayoutProps> = ({ form, showcase }) => {
  return (
    <div className="mx-auto w-full max-w-7xl py-8 md:py-16 lg:py-20">
      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 gap-8 px-4 md:grid-cols-2 md:gap-12 md:px-8 lg:gap-20">
        <div className="bg-card text-card-foreground border-border flex flex-col justify-center rounded-2xl border p-6 shadow-sm md:p-10">
          {form}
        </div>
        <div className="flex flex-col justify-center">{showcase}</div>
      </div>
    </div>
  );
};

export default AuthSplitLayout;
