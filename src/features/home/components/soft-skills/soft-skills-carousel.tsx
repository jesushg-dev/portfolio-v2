"use client";

import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { resolveSoftSkillIcon } from "@/features/soft-skills/lib/soft-skill-icons";
import SoftSkillItem from "./soft-skill-item";

export interface SoftSkillCarouselItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface SoftSkillsCarouselProps {
  items: SoftSkillCarouselItem[];
}

const SoftSkillsCarousel: FC<SoftSkillsCarouselProps> = ({ items }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const autoplayPlugin = useMemo(
    () =>
      Autoplay({
        delay: 4000,
        stopOnInteraction: false,
        stopOnMouseEnter: false,
      }),
    [],
  );

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    const frame = requestAnimationFrame(handleSelect);

    api.on("reInit", handleSelect);
    api.on("select", handleSelect);

    return () => {
      cancelAnimationFrame(frame);
      api.off("reInit", handleSelect);
      api.off("select", handleSelect);
    };
  }, [api]);

  const pauseAutoplay = useCallback(() => {
    api?.plugins()?.autoplay?.stop();
  }, [api]);

  const resumeAutoplay = useCallback(() => {
    api?.plugins()?.autoplay?.play();
  }, [api]);

  const handleItemEnter = useCallback(
    (index: number) => {
      setHoveredIndex(index);
      pauseAutoplay();
    },
    [pauseAutoplay],
  );

  const handleItemLeave = useCallback(() => {
    setHoveredIndex(null);
    resumeAutoplay();
  }, [resumeAutoplay]);

  if (items.length === 0) {
    return null;
  }

  return (
    <Carousel
      setApi={setApi}
      opts={{
        align: "center",
        loop: true,
        skipSnaps: false,
      }}
      plugins={[autoplayPlugin]}
      className="w-full px-14 sm:px-16"
    >
      <CarouselContent className="-ml-2 py-8 md:-ml-4 md:py-10">
        {items.map((item, index) => {
          const Icon = resolveSoftSkillIcon(item.icon);
          const isSpotlight =
            hoveredIndex !== null
              ? hoveredIndex === index
              : selectedIndex === index;

          return (
            <CarouselItem
              key={item.id}
              className="basis-[68%] pl-2 sm:basis-1/2 md:basis-1/3 md:pl-4 lg:basis-1/4 xl:basis-1/5"
            >
              <div
                className={cn(
                  "flex w-full justify-center py-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isSpotlight ? "scale-110" : "scale-90",
                )}
                onMouseEnter={() => handleItemEnter(index)}
                onMouseLeave={handleItemLeave}
              >
                <SoftSkillItem
                  icon={Icon}
                  title={item.title}
                  description={item.description}
                  isActive={isSpotlight}
                />
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious className="-top-20 -left-2 border-white/25 bg-black/45 text-white hover:bg-black/65 hover:text-white" />
      <CarouselNext className="-top-20 -right-2 border-white/25 bg-black/45 text-white hover:bg-black/65 hover:text-white" />
    </Carousel>
  );
};

export default SoftSkillsCarousel;
