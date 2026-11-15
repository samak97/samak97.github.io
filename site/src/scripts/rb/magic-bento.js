// The Magic Bento card effects from React Bits (reactbits.dev, MIT + Commons Clause), lifted out of its grid so
// they can sit on any card: a spotlight that follows the pointer inside a card, a border glow on every card
// edge near the pointer, twinkling stars around it, a ripple through the borders on click, and a slight press.
export function magicBento(
  cards,
  { spotlightRadius = 300, enableStars = true, particleCount = 24, starColors = [[255, 255, 255]], clickEffect = true } = {}
) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !reduced;
  const pointer = { x: -1e5, y: -1e5, inside: false, down: null };
  const light = { x: -1e5, y: -1e5, ready: false };
  const wave = { x: 0, y: 0, t: -1, duration: 1.1, reach: 800 };
  let dirty = true;
  let raf = 0;
  let last = 0;

  const states = cards.map(card => {
    card.classList.add('mb-card');
    card.style.setProperty('--mb-spot-size', `${spotlightRadius}px`);
    card.style.setProperty('--mb-border-size', `${Math.round(spotlightRadius * 0.75)}px`);
    card.insertAdjacentHTML('afterbegin', '<span class="mb-light" aria-hidden="true"></span>');
    let stars = null;
    if (enableStars && motion) {
      stars = document.createElement('canvas');
      stars.className = 'mb-stars';
      stars.setAttribute('aria-hidden', 'true');
      card.prepend(stars);
    }
    card.insertAdjacentHTML('beforeend', '<span class="mb-border" aria-hidden="true"></span>');
    return { card, stars, rect: null, near: 0, hot: 0, press: 1, vpress: 0, glow: 0, particles: null, written: {} };
  });

  const write = (state, name, value) => {
    if (state.written[name] === value) return;
    state.written[name] = value;
    state.card.style.setProperty(name, value);
  };

  const measure = () => {
    dirty = false;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    for (const state of states) {
      state.rect = state.card.getBoundingClientRect();
      if (!state.stars) continue;
      const width = Math.max(1, Math.round(state.rect.width * ratio));
      const height = Math.max(1, Math.round(state.rect.height * ratio));
      if (state.stars.width !== width || state.stars.height !== height) {
        state.stars.width = width;
        state.stars.height = height;
      }
    }
  };

  const seed = (state, rect) => {
    if (state.particles) return state.particles;
    state.particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 6,
      vy: -4 - Math.random() * 10,
      size: 0.6 + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
      rate: 1.2 + Math.random() * 2.4,
      color: starColors[Math.floor(Math.random() * starColors.length)]
    }));
    return state.particles;
  };

  const drawStars = (state, rect, lx, ly, dt, now) => {
    const context = state.stars.getContext('2d');
    if (!context) return;
    const ratio = state.stars.width / Math.max(1, rect.width);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, state.stars.width, state.stars.height);
    if (state.glow < 0.004) return;
    const reach = spotlightRadius * 0.75;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (const particle of seed(state, rect)) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.y < -4) {
        particle.y = rect.height + 4;
        particle.x = Math.random() * rect.width;
      }
      if (particle.x < -4) particle.x = rect.width + 4;
      if (particle.x > rect.width + 4) particle.x = -4;
      const distance = Math.hypot(particle.x - lx, particle.y - ly) / reach;
      if (distance >= 1) continue;
      const falloff = 1 - distance * distance * (3 - 2 * distance);
      const twinkle = 0.55 + 0.45 * Math.sin(now * 0.001 * particle.rate + particle.phase);
      const alpha = state.glow * falloff * twinkle;
      if (alpha < 0.01) continue;
      const [r, g, b] = particle.color;
      context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }
  };

  const frame = now => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (dirty) measure();
    let busy = false;

    if (!light.ready && pointer.inside) {
      light.x = pointer.x;
      light.y = pointer.y;
      light.ready = true;
    }
    const follow = 1 - Math.exp(-dt / 0.05);
    light.x += (pointer.x - light.x) * follow;
    light.y += (pointer.y - light.y) * follow;
    if (Math.abs(pointer.x - light.x) + Math.abs(pointer.y - light.y) > 0.3) busy = true;

    let waveRadius = 0;
    let waveAlpha = 0;
    if (wave.t >= 0) {
      wave.t += dt;
      const progress = Math.min(1, wave.t / wave.duration);
      waveRadius = wave.reach * (1 - Math.pow(1 - progress, 2.2));
      waveAlpha = Math.pow(1 - progress, 1.3);
      if (progress >= 1) wave.t = -1;
      else busy = true;
    }

    const margin = spotlightRadius * 0.5;
    for (const state of states) {
      const rect = state.rect;
      if (!rect || rect.bottom < -margin || rect.top > innerHeight + margin) continue;
      const lx = light.x - rect.left;
      const ly = light.y - rect.top;
      const px = pointer.x - rect.left;
      const py = pointer.y - rect.top;
      const inside = pointer.inside && px >= 0 && py >= 0 && px <= rect.width && py <= rect.height;
      const close =
        pointer.inside && px > -margin && py > -margin && px < rect.width + margin && py < rect.height + margin ? 1 : 0;

      // Each value eases towards its target and keeps the loop running until it arrives.
      const ease = (key, target, rise, fall) => {
        state[key] += (target - state[key]) * (1 - Math.exp(-dt / (target > state[key] ? rise : fall)));
        if (Math.abs(target - state[key]) < 0.002) state[key] = target;
        else busy = true;
      };
      ease('near', close, 0.12, 0.4);
      ease('hot', inside ? 1 : 0, 0.14, 0.32);
      ease('glow', inside && motion ? 1 : 0, 0.3, 0.5);

      const pressTarget = pointer.down === state.card && clickEffect && motion ? 0.985 : 1;
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      for (let step = 0; step < steps; step++) {
        state.vpress += (420 * (pressTarget - state.press) - 28 * state.vpress) * h;
        state.press += state.vpress * h;
      }
      if (Math.abs(pressTarget - state.press) < 0.0002 && Math.abs(state.vpress) < 0.001) {
        state.press = pressTarget;
        state.vpress = 0;
      } else busy = true;

      write(state, '--mb-x', `${lx.toFixed(1)}px`);
      write(state, '--mb-y', `${ly.toFixed(1)}px`);
      write(state, '--mb-near', state.near.toFixed(3));
      write(state, '--mb-hot', state.hot.toFixed(3));
      write(state, '--mb-press', state.press.toFixed(4));
      write(state, '--mb-wx', `${(wave.x - rect.left).toFixed(1)}px`);
      write(state, '--mb-wy', `${(wave.y - rect.top).toFixed(1)}px`);
      write(state, '--mb-wr', `${waveRadius.toFixed(1)}px`);
      write(state, '--mb-wa', waveAlpha.toFixed(3));

      if (state.stars && (state.glow > 0 || state.drawn)) {
        drawStars(state, rect, lx, ly, dt, now);
        state.drawn = state.glow > 0;
        if (state.glow > 0) busy = true;
      }
    }

    if (busy) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const cardOf = target => (target instanceof Element ? target.closest('.mb-card') : null);

  addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.inside = true;
    wake();
  }, { passive: true });
  addEventListener('pointerdown', event => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.inside = event.pointerType !== 'touch';
    pointer.down = cardOf(event.target);
    wake();
  }, { passive: true });
  const release = () => {
    pointer.down = null;
    wake();
  };
  addEventListener('pointerup', release, { passive: true });
  addEventListener('pointercancel', release, { passive: true });
  document.addEventListener('pointerout', event => {
    if (event.relatedTarget) return;
    pointer.inside = false;
    pointer.down = null;
    wake();
  });
  addEventListener('click', event => {
    if (!clickEffect || !motion || !cardOf(event.target)) return;
    wave.x = event.clientX;
    wave.y = event.clientY;
    wave.t = 0;
    wave.reach = Math.hypot(innerWidth, innerHeight) * 0.6 + 140;
    dirty = true;
    wake();
  });
  const onScroll = () => {
    dirty = true;
    wake();
  };
  addEventListener('scroll', onScroll, { passive: true, capture: true });
  addEventListener('resize', onScroll, { passive: true });
  const resizeObserver = new ResizeObserver(onScroll);
  cards.forEach(card => resizeObserver.observe(card));
}

export const rgb = hex => [0, 2, 4].map(i => parseInt(hex.replace('#', '').slice(i, i + 2), 16));
