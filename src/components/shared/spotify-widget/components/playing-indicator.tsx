import type { FC } from "react";
import { Pause } from "lucide-react";

interface PlayingIndicatorProps {
  color?: string;
  isPlaying?: boolean;
}

const PlayingIndicator: FC<PlayingIndicatorProps> = ({
  color = "#1DB954",
  isPlaying = true,
}) => {
  return (
    <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-[#121212] p-1 shadow-md">
      {isPlaying ? (
        <div className="flex h-full w-full items-end justify-center gap-px">
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
      ) : (
        <Pause
          className="size-2.5 fill-current"
          style={{ color }}
          aria-hidden
        />
      )}
    </div>
  );
};

export default PlayingIndicator;
