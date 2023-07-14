import React, { memo, useCallback, useMemo } from 'react';

import { loadFull } from 'tsparticles';
import Particles from 'react-particles';
import generateParticlesConfig from '../../../utils/config/particles';

import { useThemeContext } from '@/hoc/ThemeContextProvider';

import type { Engine } from 'tsparticles-engine';

//create a map to change color of particles based on theme (light/dark)
const themeMap = {
  'main-light': ['#004ecb'],
  'orange-light': ['#FFA948'],
  'main-dark': ['#004ecb'],
  'orange-dark': ['#FF8C00'],
};

const BgParticles = () => {
  const { theme } = useThemeContext();

  const skillParticles = useMemo(() => {
    return generateParticlesConfig(themeMap[theme]);
  }, [theme]);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  return <Particles id="tsparticles" className="absolute inset-0" init={particlesInit} options={skillParticles} />;
};

const areEqual = () => true;
export default memo(BgParticles, areEqual);
