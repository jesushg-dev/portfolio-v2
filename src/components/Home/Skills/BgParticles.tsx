import React, { memo, useEffect, useMemo, useState } from "react";
import { loadFull } from "tsparticles";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { Engine } from "@tsparticles/engine";

import { useThemeContext } from "@/hoc/theme-context-provider";

import generateParticlesConfig from "../../../utils/config/particles";

// create a map to change color of particles based on theme (light/dark)
const themeMap = {
  "main-light": ["#004ecb"],
  "orange-light": ["#FFA948"],
  "main-dark": ["#004ecb"],
  "orange-dark": ["#FF8C00"],
  "christmas-light": ["#12B686", "#E53E3E"],
  "christmas-dark": ["#E53E3E", "#12B686"],
};

const BgParticles = () => {
  const { theme } = useThemeContext();
  const [init, setInit] = useState(false);

  useEffect(() => {
    void initParticlesEngine(async (engine: Engine) => {
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const skillParticles = useMemo(() => {
    return generateParticlesConfig(themeMap[theme]);
  }, [theme]);

  if (!init) return null;

  return <Particles id="tsparticles" options={skillParticles} />;
};

const areEqual = () => true;
export default memo(BgParticles, areEqual);
