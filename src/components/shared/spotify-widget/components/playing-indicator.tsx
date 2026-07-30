import type { FC } from "react";

interface PlayingIndicatorProps {
  color?: string;
}

const PlayingIndicator: FC<PlayingIndicatorProps> = ({ color = "#1DB954" }) => {
  return (
    <div className="absolute -right-1 -bottom-1 flex size-5 items-end justify-center gap-px rounded-full bg-[#121212] p-1 shadow-md">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-0.5 animate-pulse rounded-full"
          style={{
            backgroundColor: color,
            height: `${40 + i * 20}%`,
            animationDelay: `${i * 150}ms`,
            animationDuration: "0.8s",
          }}
        />
      ))}
    </div>
  );
};

export default PlayingIndicator;
