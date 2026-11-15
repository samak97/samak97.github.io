// Gradual Blur from React Bits (reactbits.dev, MIT + Commons Clause) as plain DOM: gradualBlur() fixes a strip
// to the bottom of the viewport whose stacked backdrop blurs grow stronger towards the edge. With autoHide it
// fades away as the page reaches its end, so the last lines of the footer stay sharp.
const CURVES = {
  linear: t => t,
  bezier: t => t * t * (3 - 2 * t),
  'ease-in': t => t * t,
  'ease-out': t => 1 - (1 - t) * (1 - t),
  'ease-in-out': t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
};

const clamp01 = value => Math.min(Math.max(value, 0), 1);

export function gradualBlur({
  height = '6rem',
  strength = 2,
  layers = 8,
  curve = 'linear',
  exponential = true,
  opacity = 1,
  autoHide = true,
  zIndex = 25
} = {}) {
  const root = document.createElement('div');
  root.className = 'gradual-blur';
  root.setAttribute('aria-hidden', 'true');
  Object.assign(root.style, { position: 'fixed', left: '0', right: '0', bottom: '0', height, zIndex: String(zIndex), pointerEvents: 'none' });

  const count = Math.min(Math.max(Math.round(layers) || 1, 1), 16);
  const shape = CURVES[curve] || CURVES.linear;
  const maxBlur = Math.max(strength, 0) * 12;
  const level = u => {
    const t = shape(clamp01(u));
    return maxBlur * (exponential ? (Math.pow(2, 4 * t) - 1) / 15 : t);
  };
  for (let i = 0; i < count; i++) {
    // Each layer adds only the blur still missing at its depth, and is masked to start where the last one did.
    const from = level(i / count);
    const to = level((i + 1) / count);
    const radius = Math.sqrt(Math.max(to * to - from * from, 0));
    const filter = `blur(calc(${radius.toFixed(3)}px * var(--gradual-blur-reveal, 1)))`;
    const mask = `linear-gradient(to bottom, transparent ${((i / count) * 100).toFixed(2)}%, #000 ${(((i + 1) / count) * 100).toFixed(2)}%)`;
    const layer = document.createElement('div');
    Object.assign(layer.style, {
      position: 'absolute',
      inset: '0',
      backdropFilter: filter,
      webkitBackdropFilter: filter,
      maskImage: mask,
      webkitMaskImage: mask,
      opacity: String(opacity)
    });
    root.appendChild(layer);
  }
  document.body.appendChild(root);

  if (!autoHide) return;
  const update = () => {
    const room = document.documentElement.scrollHeight - innerHeight - scrollY;
    root.style.setProperty('--gradual-blur-reveal', clamp01(room / Math.max(root.offsetHeight, 1)).toFixed(3));
  };
  update();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
}
