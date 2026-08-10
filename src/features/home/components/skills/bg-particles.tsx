"use client";

import { memo, useCallback, useMemo } from "react";
import { loadSlim } from "@tsparticles/slim";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

import { useThemeContext } from "@/hoc/theme-context-provider";
import generateParticlesConfig from "@/utils/config/particles";

const themeMap = {
  "main-light": ["#004ecb"],
  "orange-light": ["#FFA948"],
  "main-dark": ["#004ecb"],
  "orange-dark": ["#FF8C00"],
  "christmas-light": ["#12B686", "#E53E3E"],
  "christmas-dark": ["#E53E3E", "#12B686"],
} as const;

function BgParticles() {
  const { theme } = useThemeContext();

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const skillParticles = useMemo(
    (): ISourceOptions => generateParticlesConfig(themeMap[theme]),
    [theme],
  );

  return (
    <ParticlesProvider init={particlesInit}>
      <Particles
        id="tsparticles"
        className="absolute inset-0"
        options={skillParticles}
      />
    </ParticlesProvider>
  );
}

const areEqual = () => true;
export default memo(BgParticles, areEqual);
