import { initUI } from './ui';
import { initMotion, scrollToTarget } from './motion';
import { initPalette } from './palette';
import { initHeroCanvas } from './hero-canvas';
import { initGpuDemo } from './gpu-demo';

initUI();
initMotion();
initPalette(scrollToTarget);
initHeroCanvas();
initGpuDemo();
