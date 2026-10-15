import { useEffect, type ReactNode, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RiCloseCircleFill } from "react-icons/ri";
import { cn } from "@/lib/utils";

interface IModalProps {
  className?: string;
  children?: ReactNode;
  onClickBackdrop?: () => void;
}

const Modal: FC<IModalProps> = ({ children, onClickBackdrop, className }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          role="button"
          tabIndex={-1}
          aria-label="Close dialog backdrop"
          className="bg-background/80 fixed inset-0 backdrop-blur-xs transition-opacity"
          onClick={onClickBackdrop}
          onKeyUp={onClickBackdrop}
        />
        <div
          className={cn(
            "bg-card text-card-foreground border-border/40 relative z-50 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all sm:max-w-xl",
            className,
          )}
        >
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

interface ICloseModalProps {
  onClick?: () => void;
  className?: string;
  classIcon?: string;
  title: string;
}

const CloseModal: FC<ICloseModalProps> = ({
  onClick,
  className,
  classIcon,
  title,
}) => {
  return (
    <motion.button
      title={title}
      aria-label={title}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-3.5 right-3.5 z-20 flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      <RiCloseCircleFill className={cn("size-6", classIcon)} />
    </motion.button>
  );
};

export { CloseModal };
export default Modal;
