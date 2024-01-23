import type { FC } from "react";
import { motion } from "framer-motion";

const cursorVariants = {
  blinking: {
    opacity: [0, 0, 1, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatDelay: 0,
      ease: "linear",
      times: [0, 0.5, 0.5, 1],
    },
  },
};

export interface ICursorBlinkerProps {
  cursorClassName?: string;
}

const CursorBlinker: FC<ICursorBlinkerProps> = ({ cursorClassName }) => {
  return (
    <motion.p
      variants={cursorVariants}
      animate="blinking"
      className={`inline-block bg-slate-900${cursorClassName}`}
    >
      |
    </motion.p>
  );
};

export default CursorBlinker;
