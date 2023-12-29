'use client';

import { useEffect } from 'react';
import type { FC } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export interface IRedoAnimTextProps {
  delay: number;
  texts: string[];
  textClassName?: string;
}

const RedoAnimText: FC<IRedoAnimTextProps> = ({ delay, texts, textClassName }) => {
  const textIndex = useMotionValue(0);

  const baseText = useTransform(textIndex, (latest) => texts[latest] || '');
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayText = useTransform(rounded, (latest) => baseText.get().slice(0, latest));
  const updatedThisRound = useMotionValue(true);

  useEffect(() => {
    animate(count, 60, {
      type: 'tween',
      delay,
      duration: 3,
      ease: 'easeIn',
      repeat: Infinity,
      repeatType: 'reverse',
      repeatDelay: 2,
      onUpdate(latest) {
        if (updatedThisRound.get() === true && latest > 0) {
          updatedThisRound.set(false);
        } else if (updatedThisRound.get() === false && latest === 0) {
          if (textIndex.get() === texts.length - 1) {
            textIndex.set(0);
          } else {
            textIndex.set(textIndex.get() + 1);
          }
          updatedThisRound.set(true);
        }
      },
    });
  }, []);

  return <motion.span className={`inline ${textClassName}`}>{displayText}</motion.span>;
};

export default RedoAnimText;
