"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PartyPopper, Sparkles, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CelebrationAnimationProps {
  show: boolean;
  onComplete?: () => void;
  companyName: string;
  position: string;
}

interface ConfettiParticle {
  id: number;
  x: number;
  duration: number;
  delay: number;
}

function createConfettiParticles(count: number): ConfettiParticle[] {
  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 1200;

  return Array.from({ length: count }, (_, id) => ({
    id,
    x: Math.random() * viewportWidth,
    duration: Math.random() * 2 + 2,
    delay: Math.random() * 2,
  }));
}

export function CelebrationAnimation({
  show,
  onComplete,
  companyName,
  position,
}: CelebrationAnimationProps) {
  const [confettiParticles] = useState(() => createConfettiParticles(20));

  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onComplete?.();
    }, 4000);

    return () => clearTimeout(timer);
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <Card className="mx-4 w-96">
              <CardContent className="space-y-6 p-8 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                  className="flex justify-center"
                >
                  <Trophy className="h-16 w-16 text-yellow-500" />
                </motion.div>

                <div className="space-y-2">
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-green-600"
                  >
                    ¡Felicidades! 🎉
                  </motion.h2>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg"
                  >
                    Has sido contratado como
                  </motion.p>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-primary text-xl font-semibold"
                  >
                    {position}
                  </motion.p>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-lg"
                  >
                    en <span className="font-semibold">{companyName}</span>
                  </motion.p>
                </div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="flex justify-center gap-4"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.5,
                      delay: 0,
                    }}
                  >
                    <PartyPopper className="h-8 w-8 text-purple-500" />
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.5,
                      delay: 0.3,
                    }}
                  >
                    <Sparkles className="h-8 w-8 text-yellow-500" />
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.5,
                      delay: 0.6,
                    }}
                  >
                    <PartyPopper className="h-8 w-8 text-pink-500" />
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="pointer-events-none fixed inset-0">
            {confettiParticles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{
                  x: particle.x,
                  y: -20,
                  rotate: 0,
                }}
                animate={{
                  y: window.innerHeight + 20,
                  rotate: 360,
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: "linear",
                }}
                className="absolute h-3 w-3 rounded-full bg-linear-to-r from-yellow-400 to-pink-500"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
