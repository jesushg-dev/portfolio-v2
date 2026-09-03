"use client";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { AnimatePresence, motion } from "motion/react";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Hint } from "@/components/hint";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
  type JSX,
} from "react";

type LinkProps = ComponentProps<typeof Link>;

const PIN_STORAGE_KEY = "admin-sidebar-pinned";
const pinListeners = new Set<() => void>();

function subscribePinned(onStoreChange: () => void) {
  pinListeners.add(onStoreChange);
  return () => {
    pinListeners.delete(onStoreChange);
  };
}

function getPinnedSnapshot() {
  try {
    // Default pinned; only unpinned if user explicitly chose "0".
    return localStorage.getItem(PIN_STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function getPinnedServerSnapshot() {
  return true;
}

function emitPinnedChange() {
  for (const listener of pinListeners) listener();
}

interface SidebarContextProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  animate: boolean;
  pinned: boolean;
  setPinned: (pinned: boolean) => void;
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
  const [openState, setOpenState] = useState(true);
  const pinned = useSyncExternalStore(
    subscribePinned,
    getPinnedSnapshot,
    getPinnedServerSnapshot,
  );

  const open = openProp ?? openState;
  const setOpen = setOpenProp ?? setOpenState;

  const setPinned = useCallback(
    (next: boolean) => {
      try {
        localStorage.setItem(PIN_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore storage access errors
      }
      emitPinnedChange();
      if (next) setOpen(true);
    },
    [setOpen],
  );

  return (
    <SidebarContext.Provider
      value={{ open, setOpen, animate, pinned, setPinned }}
    >
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

export const SidebarBody = ({
  mobileActions,
  ...props
}: ComponentProps<typeof motion.div> & { mobileActions?: ReactNode }) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar
        actions={mobileActions}
        {...(props as ComponentProps<"div">)}
      />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate, pinned } = useSidebar();
  return (
    <motion.div
      className={cn(
        "bg-card border-border hidden h-full min-h-0 shrink-0 overflow-hidden border-r px-4 py-4 transition-[width] duration-300 md:flex md:flex-col",
        className,
      )}
      animate={{
        width: animate ? (open || pinned ? "256px" : "70px") : "256px",
      }}
      onMouseEnter={() => {
        if (!pinned) setOpen(true);
      }}
      onMouseLeave={() => {
        if (!pinned) setOpen(false);
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const SidebarPinToggle = ({ className }: { className?: string }) => {
  const { open, pinned, setPinned } = useSidebar();
  const t = useTranslations("admin.shell");
  const Icon = pinned ? PanelLeftClose : PanelLeftOpen;
  const label = pinned ? t("unpinSidebar") : t("pinSidebar");

  if (!open && !pinned) return null;

  return (
    <Hint label={label} side="bottom" align="end">
      <button
        type="button"
        aria-pressed={pinned}
        aria-label={label}
        onClick={() => setPinned(!pinned)}
        className={cn(
          "text-muted-foreground hover:bg-muted hover:text-foreground hidden size-8 shrink-0 items-center justify-center rounded-lg transition-colors md:inline-flex",
          pinned && "bg-primary/10 text-primary",
          className,
        )}
      >
        <Icon className="size-4" aria-hidden />
      </button>
    </Hint>
  );
};

export const MobileSidebar = ({
  className,
  children,
  actions,
  ...props
}: ComponentProps<"div"> & { actions?: ReactNode }) => {
  const { open, setOpen } = useSidebar();
  const t = useTranslations("global.header");

  return (
    <>
      <div
        className={cn(
          "bg-card border-border flex h-14 w-full flex-row items-center justify-between gap-3 border-b px-4 md:hidden",
        )}
        {...props}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">{actions}</div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-sidebar-panel"
          aria-label={open ? t("closeMenu") : t("openMenu")}
          onClick={() => setOpen(!open)}
          className="text-foreground inline-flex shrink-0 rounded-lg p-2"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-sidebar-panel"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "bg-background fixed inset-0 z-100 flex h-full min-h-0 w-full flex-col justify-between overflow-hidden p-10",
                className,
              )}
            >
              <button
                type="button"
                aria-label={t("closeMenu")}
                onClick={() => setOpen(false)}
                className="text-foreground absolute top-10 right-10 z-50 inline-flex rounded-lg p-2"
              >
                <X className="h-6 w-6" aria-hidden />
              </button>
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
  const { open, animate, pinned } = useSidebar();
  const showLabel = !animate || open || pinned;
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
          display: showLabel ? "inline-block" : "none",
          opacity: showLabel ? 1 : 0,
        }}
        className={cn(
          "m-0! inline-block p-0! text-sm font-medium whitespace-pre transition duration-150 group-hover/sidebar:translate-x-1",
          link.active ? "text-primary" : "text-foreground",
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
