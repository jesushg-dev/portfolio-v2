"use client";

import React, { memo, useRef } from "react";

import { motion, useInView } from "framer-motion";

interface IHeaderArticleProps {
  title: string;
  subtitle?: string;
  description?: string;
  className?: string;
  subClassName?: string;
  showIcon?: boolean;
}

const animationVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" } },
};

const HeaderArticle: React.FC<IHeaderArticleProps> = ({
  title,
  subtitle = "",
  description = "",
  className = "",
  subClassName = "",
  showIcon = false,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref}>
      <motion.div
        className={`relative mx-auto my-14 flex max-w-[31.875] flex-col items-center justify-center gap-2 text-center ${className} ${subClassName}`}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
      >
        {subtitle && (
          <motion.span
            className="block text-lg font-semibold text-primary-700"
            variants={animationVariants}
          >
            {subtitle}
          </motion.span>
        )}
        <motion.div className="relative" variants={animationVariants}>
          <motion.h2
            className=" text-3xl font-bold text-primaryText-500 sm:text-4xl md:text-[40px]"
            variants={animationVariants}
          >
            {title}
          </motion.h2>
          {showIcon && (
            <motion.div
              className="absolute -end-14 -top-14 hidden -translate-y-14 translate-x-20 md:block"
              variants={animationVariants}
            >
              <svg
                className="h-auto w-16 text-primary-500"
                width={121}
                height={135}
                viewBox="0 0 121 135"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  d="M5 16.4754C11.7688 27.4499 21.2452 57.3224 5 89.0164"
                  stroke="currentColor"
                  strokeWidth={10}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  transition={{ duration: 2 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                />
                <motion.path
                  d="M33.6761 112.104C44.6984 98.1239 74.2618 57.6776 83.4821 5"
                  stroke="currentColor"
                  strokeWidth={10}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 2 }}
                />
                <motion.path
                  d="M50.5525 130C68.2064 127.495 110.731 117.541 116 78.0874"
                  stroke="currentColor"
                  strokeWidth={10}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 2 }}
                />
              </svg>
            </motion.div>
          )}
        </motion.div>
        {description && (
          <motion.p
            className="text-body-color mt-2 text-base"
            variants={animationVariants}
          >
            {description}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default memo(HeaderArticle);
