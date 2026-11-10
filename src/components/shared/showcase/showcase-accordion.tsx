import type { FC, ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShowcaseAccordionItem {
  id?: string;
  question: string;
  answer: ReactNode;
}

export interface ShowcaseAccordionProps {
  items: ShowcaseAccordionItem[];
  className?: string;
}

export const ShowcaseAccordion: FC<ShowcaseAccordionProps> = ({
  items,
  className,
}) => {
  return (
    <div
      className={cn(
        "divide-border/80 border-border/80 mx-auto max-w-[47.5rem] divide-y border-t border-b",
        className,
      )}
    >
      {items.map((item, idx) => (
        <details key={item.id ?? idx} className="group">
          <summary className="text-foreground hover:text-primary flex w-full cursor-pointer list-none items-center justify-between py-6 text-[1.1875rem] font-medium tracking-[-0.01em] transition-colors [&::-webkit-details-marker]:hidden">
            <span className="flex-1 pr-4">{item.question}</span>
            <Plus
              aria-hidden
              className="text-muted-foreground size-5 shrink-0 transition-transform duration-200 group-open:rotate-45"
            />
          </summary>
          <div className="text-muted-foreground pb-6 text-[1.0625rem] leading-relaxed">
            {typeof item.answer === "string" ? (
              <p>{item.answer}</p>
            ) : (
              item.answer
            )}
          </div>
        </details>
      ))}
    </div>
  );
};
