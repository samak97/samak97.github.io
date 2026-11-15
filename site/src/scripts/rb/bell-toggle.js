// Bell Toggle from React Bits (reactbits.dev, MIT + Commons Clause) as plain DOM: bellToggle(root) animates a
// .bell-toggle written in markup (see components/CopyEmail.astro). Turning it on rings the icon with waves on
// either side, crossfades the label and slides the button's width to fit; turning it off just slides back.
// Motion's spring is replaced by a 300 ms ease-out, which is what that spring (no bounce) amounts to.
const SEG_EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';
const WARP = 0.6;

const passOffset = (k, passes) => 1 - Math.pow(1 - (k + 2 / 3) / (passes + 1), WARP);
const ringKeyframes = (from, amplitude, passes, decay) => {
  const frames = [{ transform: `rotate(${from}deg)`, offset: 0, easing: SEG_EASE }];
  for (let k = 0; k < passes; k++) {
    const angle = amplitude * Math.pow(1 - k / passes, decay) * (k % 2 ? 1 : -1);
    frames.push({ transform: `rotate(${angle.toFixed(2)}deg)`, offset: passOffset(k, passes), easing: SEG_EASE });
  }
  frames.push({ transform: 'rotate(0deg)', offset: 1 });
  return frames;
};
const liveAngle = el => {
  const tf = getComputedStyle(el).transform;
  if (!tf || tf === 'none') return 0;
  const m = new DOMMatrix(tf);
  return (Math.atan2(m.b, m.a) * 180) / Math.PI;
};

export function bellToggle(root, { ringAmplitude = 17, ringPasses = 5, ringDecay = 1, ringDuration = 820, waves = true } = {}) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const button = root.querySelector('.bell-toggle__button');
  const glyph = root.querySelector('.bell-toggle__glyph');
  const waveLeft = root.querySelector('.bell-toggle__wave--left');
  const waveRight = root.querySelector('.bell-toggle__wave--right');
  const off = root.querySelector('.bell-toggle__face--off');
  const on = root.querySelector('.bell-toggle__face--on');
  let t = root.dataset.on === 'true' ? 1 : 0;
  let wOff = 0;
  let wOn = 0;
  let raf = 0;

  // The button is as wide as the longer label; the clip trims it to the label being shown.
  const clip = () => root.style.setProperty('--bt-clip', `${Math.max(wOff, wOn) - (wOff + (wOn - wOff) * t)}px`);
  const measure = () => {
    wOff = off.offsetWidth;
    wOn = on.offsetWidth;
    clip();
  };
  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(off);
  observer.observe(on);
  document.fonts?.ready.then(measure);

  const slide = target => {
    cancelAnimationFrame(raf);
    if (reduce) {
      t = target;
      clip();
      return;
    }
    const from = t;
    const start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / 300);
      t = from + (target - from) * (1 - Math.pow(1 - p, 4));
      clip();
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  const swing = () => {
    glyph.getAnimations().forEach(a => a.cancel());
    glyph.animate(ringKeyframes(liveAngle(glyph), ringAmplitude, ringPasses, ringDecay), { duration: ringDuration, easing: 'linear' });
    if (!waves) return;
    for (let k = 0; k < ringPasses; k++) {
      const side = k % 2 ? waveRight : waveLeft;
      if (!side) continue;
      const strength = Math.pow(1 - k / ringPasses, ringDecay);
      side.animate(
        [
          { opacity: 0, transform: 'scale(0.55)' },
          { opacity: 0.9 * strength, offset: 0.3 },
          { opacity: 0, transform: 'scale(1.25)' }
        ],
        { duration: 380, delay: passOffset(k, ringPasses) * ringDuration, easing: 'ease-out' }
      );
    }
  };

  const press = e => {
    if (e.button === 0) root.dataset.pressed = '';
  };
  const release = () => delete root.dataset.pressed;
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);

  return {
    button,
    set(value) {
      const was = root.dataset.on === 'true';
      if (value === was) return;
      root.dataset.on = String(value);
      button.setAttribute('aria-pressed', String(value));
      slide(value ? 1 : 0);
      if (value && !reduce) swing();
    }
  };
}
