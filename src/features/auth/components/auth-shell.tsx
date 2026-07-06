import type { FC, ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
}

const AuthShell: FC<AuthShellProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900">
      <div className="w-full [--radius:0.5rem]">
        <div className="flex min-h-full w-full items-center justify-center">
          <div className="relative w-full overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 z-0 h-screen w-screen"
            >
              <div
                className="absolute top-0 left-0"
                style={{
                  transform: "translateY(-350px) rotate(-45deg)",
                  width: "560px",
                  height: "1380px",
                  background:
                    "radial-gradient(68.54% 68.72% at 55.02% 31.46%, rgba(179, 217, 255, 0.08) 0px, rgba(26, 140, 255, 0.02) 50%, rgba(0, 115, 230, 0) 80%)",
                }}
              />
              <div
                className="absolute top-0 left-0"
                style={{
                  transform: "rotate(-45deg) translate(5%, -50%)",
                  transformOrigin: "left top",
                  width: "240px",
                  height: "1380px",
                  background:
                    "radial-gradient(50% 50%, rgba(179, 217, 255, 0.06) 0px, rgba(26, 140, 255, 0.02) 80%, transparent 100%)",
                }}
              />
              <div
                className="absolute top-0 left-0"
                style={{
                  borderRadius: "20px",
                  transform: "rotate(-45deg) translate(-180%, -70%)",
                  transformOrigin: "left top",
                  width: "240px",
                  height: "1380px",
                  background:
                    "radial-gradient(50% 50%, rgba(179, 217, 255, 0.04) 0px, rgba(0, 115, 230, 0.02) 80%, transparent 100%)",
                }}
              />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
