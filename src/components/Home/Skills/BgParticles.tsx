import React, { memo, useCallback } from 'react';

import { loadFull } from 'tsparticles';
import Particles from 'react-particles';
import { skillParticles } from '../../../utils/config/particles';

import type { Engine } from 'tsparticles-engine';

const BgParticles = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  return <Particles id="tsparticles" className="absolute inset-0" init={particlesInit} options={skillParticles} />;
};

const areEqual = () => true;
export default memo(BgParticles, areEqual);
