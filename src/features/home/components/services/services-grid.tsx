"use client";

import { useState, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceCard {
  id: string;
  className: string;
  content: ReactNode;
}

interface ServicesGridProps {
  cards: ServiceCard[];
  banner: ReactNode;
  seeMoreLabel: string;
  seeLessLabel: string;
}

const INITIAL_VISIBLE_COUNT = 5;
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function handlePointerMove(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty(
    "--x",
    `${event.clientX - rect.left}px`,
  );
  event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
}

function handlePointerLeave(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty("--x");
  event.currentTarget.style.removeProperty("--y");
}

/** Static card contents arrive from the server; only expansion and effects run here. */
export function ServicesGrid({
  cards,
  banner,
  seeMoreLabel,
  seeLessLabel,
}: ServicesGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleCards = isExpanded
    ? cards
    : cards.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <motion.div
      variants={containerVariants}
      initial={false}
      whileInView="visible"
      viewport={{ once: true }}
      className="grid w-full gap-5 md:grid-cols-12"
    >
      <AnimatePresence initial={false}>
        {visibleCards.map((card) => (
          <motion.article
            key={card.id}
            variants={itemVariants}
            initial={false}
            animate="visible"
            exit={{ opacity: 0, y: 16, transition: { duration: 0.25 } }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className={cn(
              "b-card-glow group border-border bg-card hover:border-primary/50 relative flex flex-col justify-between overflow-hidden rounded-[2rem] border p-6 shadow-xs transition-all duration-300 hover:shadow-xl",
              card.className,
            )}
          >
            {card.content}
          </motion.article>
        ))}
      </AnimatePresence>

      {cards.length > INITIAL_VISIBLE_COUNT && (
        <div className="flex justify-center py-2 md:col-span-12">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsExpanded((previous) => !previous)}
            aria-expanded={isExpanded}
            className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors"
          >
            <span>{isExpanded ? seeLessLabel : seeMoreLabel}</span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-300",
                isExpanded && "rotate-180",
              )}
              aria-hidden="true"
            />
          </Button>
        </div>
      )}
      <motion.div variants={itemVariants} className="md:col-span-12">
        {banner}
      </motion.div>
    </motion.div>
  );
}
