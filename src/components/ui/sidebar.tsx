"use client";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
  type JSX,
} from "react";

type LinkProps = ComponentProps<typeof Link>;

interface SidebarContextProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: ReactNode;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp ?? openState;
  const setOpen = setOpenProp ?? setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: ReactNode;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "bg-card border-border hidden h-full shrink-0 border-r px-4 py-4 transition-[width] duration-300 md:flex md:flex-col",
        className,
      )}
      animate={{
        width: animate ? (open ? "256px" : "70px") : "256px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "bg-card border-border flex h-14 w-full flex-row items-center justify-between border-b px-4 md:hidden",
        )}
        {...props}
      >
        <div className="z-20 flex w-full justify-end">
          <Menu
            className="text-foreground h-5 w-5 cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "bg-background fixed inset-0 z-[100] flex h-full w-full flex-col justify-between p-10",
                className,
              )}
            >
              <div
                className="text-foreground absolute top-10 right-10 z-50 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X className="h-6 w-6" />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: {
    label: string;
    href: LinkProps["href"];
    icon: JSX.Element | ReactNode;
    active?: boolean;
  };
  className?: string;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      className={cn(
        "group/sidebar flex items-center justify-start gap-3 rounded-lg px-2 py-2 transition-colors",
        link.active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
        {link.icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "!m-0 inline-block !p-0 text-sm font-medium whitespace-pre transition duration-150 group-hover/sidebar:translate-x-1",
          link.active ? "text-primary" : "text-foreground",
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
