"use client";

import type { FC, ReactNode } from "react";
import { motion } from "motion/react";
import {
  FaSpotify,
  FaTerminal,
  FaFileAlt,
  FaFolderOpen,
  FaCog,
} from "react-icons/fa";

import { useIOSNavigation } from "./hooks/use-ios-navigation";
import { cn } from "@/lib/utils";

export interface IOSAppItem {
  id: string;
  name: string;
  icon: ReactNode;
  bgColor: string;
  badge?: string | number;
}

export const DEFAULT_IOS_APPS: IOSAppItem[] = [
  {
    id: "spotify",
    name: "Spotify",
    icon: <FaSpotify className="size-6 text-white" />,
    bgColor: "bg-green-600",
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: <FaTerminal className="size-5 text-green-400" />,
    bgColor: "bg-zinc-900 border border-zinc-700",
  },
  {
    id: "cv",
    name: "Curriculum",
    icon: <FaFileAlt className="size-5 text-white" />,
    bgColor: "bg-blue-600",
  },
  {
    id: "projects",
    name: "Proyectos",
    icon: <FaFolderOpen className="size-5 text-white" />,
    bgColor: "bg-amber-600",
  },
  {
    id: "settings",
    name: "Ajustes",
    icon: <FaCog className="size-5 text-zinc-300" />,
    bgColor: "bg-zinc-700",
  },
];

interface IOSSpringBoardProps {
  apps?: IOSAppItem[];
  className?: string;
  onOpenApp?: (appId: string) => void;
}

export const IOSSpringBoard: FC<IOSSpringBoardProps> = ({
  apps = DEFAULT_IOS_APPS,
  className,
  onOpenApp,
}) => {
  const { push } = useIOSNavigation();

  const handleAppClick = (app: IOSAppItem) => {
    if (onOpenApp) {
      onOpenApp(app.id);
    } else if (app.id === "spotify") {
      push("now-playing", {}, "Reproduciendo");
    } else {
      push(app.id, {}, app.name);
    }
  };

  return (
    <div
      className={cn(
        "flex size-full flex-col justify-between p-4 pt-12 text-white",
        className,
      )}
    >
      <div className="grid grid-cols-4 gap-4">
        {apps.map((app) => (
          <motion.div
            key={app.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleAppClick(app)}
            className="group flex cursor-pointer flex-col items-center gap-1"
          >
            <div
              className={cn(
                "relative flex size-13 items-center justify-center rounded-2xl shadow-lg transition-shadow group-hover:shadow-xl",
                app.bgColor,
              )}
            >
              {app.icon}
              {app.badge !== undefined && (
                <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                  {app.badge}
                </span>
              )}
            </div>
            <span className="truncate text-[10px] font-medium text-white/90 drop-shadow-sm">
              {app.name}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Dock Area at bottom of SpringBoard */}
      <div className="mx-auto w-full max-w-64 rounded-3xl bg-white/20 p-2.5 backdrop-blur-md">
        <div className="flex justify-around">
          {apps.slice(0, 4).map((app) => (
            <motion.div
              key={`dock-${app.id}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAppClick(app)}
              className={cn(
                "flex size-11 cursor-pointer items-center justify-center rounded-2xl shadow-md",
                app.bgColor,
              )}
            >
              {app.icon}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IOSSpringBoard;
