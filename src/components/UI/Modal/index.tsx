import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCloseCircleFill } from "react-icons/ri";

interface IModalProps {
  className?: string;
  children?: React.ReactNode;
  onClickBackdrop?: () => void;
}

const Modal: React.FC<IModalProps> = ({
  children,
  onClickBackdrop,
  className,
}) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          role="button"
          tabIndex={-1}
          className="absolute inset-0 bg-background-900 opacity-60"
          onClick={onClickBackdrop}
          onKeyUp={onClickBackdrop}
        />
        <div
          className={`selection: z-50 h-full max-h-screen w-full overflow-y-auto border border-background-100 bg-background-50 shadow-lg md:h-auto md:w-3/5 md:rounded-lg lg:w-2/5${className}`}
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

const CloseModal: React.FC<ICloseModalProps> = ({
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
      className={`pressable absolute right-3 top-3 p-2 text-primaryText-500 ${className}`}
    >
      <RiCloseCircleFill className={`h-7 w-7 ${classIcon}`} />
    </motion.button>
  );
};

export { CloseModal };
export default Modal;
