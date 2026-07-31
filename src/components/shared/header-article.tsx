import type { FC } from "react";

interface IHeaderArticleProps {
  title: string;
  subtitle?: string;
  description?: string;
  className?: string;
  subClassName?: string;
  showIcon?: boolean;
  titleClassName?: string;
}

const HeaderArticle: FC<IHeaderArticleProps> = ({
  title,
  subtitle = "",
  description = "",
  className = "",
  subClassName = "",
  showIcon = false,
  titleClassName = "text-foreground",
}) => (
  <div
    className={`section-header-rise relative mx-auto my-14 flex flex-col items-center justify-center gap-2 text-center ${className} ${subClassName}`}
  >
    {subtitle ? (
      <span className="text-primary block text-lg font-semibold">
        {subtitle}
      </span>
    ) : null}
    <div className="relative">
      <h2
        className={`text-3xl font-bold sm:text-4xl md:text-[40px] ${titleClassName}`}
      >
        {title}
      </h2>
      {showIcon ? (
        <div
          className="absolute -inset-e-14 -top-14 hidden translate-x-20 -translate-y-14 md:block"
          aria-hidden
        >
          <svg
            className="text-primary-500 h-auto w-16"
            width={121}
            height={135}
            viewBox="0 0 121 135"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 16.4754C11.7688 27.4499 21.2452 57.3224 5 89.0164"
              stroke="currentColor"
              strokeWidth={10}
              strokeLinecap="round"
            />
            <path
              d="M33.6761 112.104C44.6984 98.1239 74.2618 57.6776 83.4821 5"
              stroke="currentColor"
              strokeWidth={10}
              strokeLinecap="round"
            />
            <path
              d="M50.5525 130C68.2064 127.495 110.731 117.541 116 78.0874"
              stroke="currentColor"
              strokeWidth={10}
              strokeLinecap="round"
            />
          </svg>
        </div>
      ) : null}
    </div>
    {description ? (
      <p className="text-muted-foreground mt-2 text-base whitespace-pre-line">{description}</p>
    ) : null}
  </div>
);

export default HeaderArticle;
