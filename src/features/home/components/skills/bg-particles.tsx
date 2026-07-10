import { memo, useMemo } from "react";
import { loadFull } from "tsparticles";
import Particles, {
  ParticlesProvider,
  useParticlesProvider,
} from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";

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

function BgParticlesCanvas() {
  const { theme } = useThemeContext();
  const { loaded } = useParticlesProvider();

  const skillParticles = useMemo(
    (): ISourceOptions => generateParticlesConfig(themeMap[theme]),
    [theme],
  );

  if (!loaded) return null;

  return <Particles id="tsparticles" options={skillParticles} />;
}

const BgParticles = () => (
  <ParticlesProvider init={loadFull}>
    <BgParticlesCanvas />
  </ParticlesProvider>
);

const areEqual = () => true;
export default memo(BgParticles, areEqual);
