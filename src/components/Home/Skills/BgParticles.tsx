import React, { memo, useEffect, useMemo, useState } from 'react';

import { loadFull } from "tsparticles";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import generateParticlesConfig from '../../../utils/config/particles';

import { useThemeContext } from '@/hoc/ThemeContextProvider';

import type { Engine } from "@tsparticles/engine";


//create a map to change color of particles based on theme (light/dark)
const themeMap = {
  'main-light': ['#004ecb'],
  'orange-light': ['#FFA948'],
  'main-dark': ['#004ecb'],
  'orange-dark': ['#FF8C00'],
};

const BgParticles = () => {
  const { theme } = useThemeContext();
  const [ init, setInit ] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const skillParticles = useMemo(() => {
    return generateParticlesConfig(themeMap[theme]);
  }, [theme]);

  return (
    <>
      {init && 
        <Particles
          id="tsparticles"
          options={skillParticles}
        />
      }
    </>
  )
};

const areEqual = () => true;
export default memo(BgParticles, areEqual);
