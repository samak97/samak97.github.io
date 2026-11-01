// Hero background: drifting particles that link up near each other and fall into the pointer's gravity well.
// Cheap 2D canvas, sized to the device, paused whenever the hero is off-screen.

export function initHeroCanvas() {
  const canvas = document.querySelector<HTMLCanvasElement>('.hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const motion = document.documentElement.classList.contains('motion');
  const coarse = matchMedia('(pointer: coarse)').matches;
  const dpr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);

  let w = 0;
  let h = 0;
  let pts: { x: number; y: number; vx: number; vy: number; r: number; hue: number }[] = [];
  const pointer = { x: -9999, y: -9999 };
  let colors = readColors();
  let running = false;
  let raf = 0;

  function readColors() {
    const s = getComputedStyle(document.documentElement);
    return [s.getPropertyValue('--c-web'), s.getPropertyValue('--c-gfx'), s.getPropertyValue('--c-game')].map((c) => c.trim());
  }

  function resize() {
    const rect = canvas!.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas!.width = Math.round(w * dpr);
    canvas!.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(110, (w * h) / (coarse ? 16000 : 11000)));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.8,
      hue: (Math.random() * 3) | 0,
    }));
  }

  const LINK = 120;
  const WELL = coarse ? 200 : 280; // gravity radius around the pointer
  const CORE = 64; // inside this, particles are pushed out so they orbit instead of collapsing
  const MAX_SPEED = 3;
  function draw() {
    ctx!.clearRect(0, 0, w, h);
    const active = pointer.x > -999;

    if (motion && active) {
      // Soft glow marking the gravity well.
      const g = ctx!.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, WELL * 0.6);
      g.addColorStop(0, colors[0]);
      g.addColorStop(1, 'transparent');
      ctx!.globalAlpha = 0.12;
      ctx!.fillStyle = g;
      ctx!.fillRect(pointer.x - WELL, pointer.y - WELL, WELL * 2, WELL * 2);
      ctx!.globalAlpha = 1;
    }

    for (const p of pts) {
      if (!motion) continue;
      if (active) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < WELL) {
          const pull = d < CORE ? -0.09 : (1 - d / WELL) * 0.07;
          p.vx += (dx / d) * pull;
          p.vy += (dy / d) * pull;
          // A small sideways nudge turns the fall into a swirl.
          p.vx += (-dy / d) * 0.012;
          p.vy += (dx / d) * 0.012;
        }
      }
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > MAX_SPEED) {
        p.vx *= MAX_SPEED / sp;
        p.vy *= MAX_SPEED / sp;
      }
      // Ease back to a lazy drift once the pointer leaves.
      const damp = active ? 0.985 : 0.97;
      if (sp > 0.35) {
        p.vx *= damp;
        p.vy *= damp;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      p.x = Math.min(w, Math.max(0, p.x));
      p.y = Math.min(h, Math.max(0, p.y));
    }

    if (motion && active) {
      // Threads from the pointer to the particles it's holding.
      ctx!.lineWidth = 1;
      ctx!.strokeStyle = colors[0];
      for (const p of pts) {
        const d = Math.hypot(pointer.x - p.x, pointer.y - p.y);
        if (d < WELL * 0.6) {
          ctx!.globalAlpha = (1 - d / (WELL * 0.6)) * 0.5;
          ctx!.beginPath();
          ctx!.moveTo(pointer.x, pointer.y);
          ctx!.lineTo(p.x, p.y);
          ctx!.stroke();
        }
      }
      ctx!.globalAlpha = 1;
    }
    ctx!.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          ctx!.globalAlpha = (1 - Math.sqrt(d2) / LINK) * 0.35;
          ctx!.strokeStyle = colors[a.hue];
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }
    }
    ctx!.globalAlpha = 0.9;
    for (const p of pts) {
      ctx!.fillStyle = colors[p.hue];
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.globalAlpha = 1;
  }

  function loop() {
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running || !motion) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  resize();
  draw();

  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resize();
      draw();
    }, 150);
  });

  const hero = canvas.closest<HTMLElement>('.hero')!;
  // Listen on the window, not the hero: the canvas is full-bleed, wider than the hero's content column,
  // so the gravity must follow the pointer all the way to the screen edges.
  const clearPointer = () => {
    pointer.x = pointer.y = -9999;
  };
  const setPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) return clearPointer();
    pointer.x = x;
    pointer.y = y;
  };
  addEventListener('pointermove', setPointer, { passive: true });
  addEventListener('pointerdown', setPointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', clearPointer);
  // On touch, the well follows the finger and lets go when it lifts.
  addEventListener('pointerup', (e) => e.pointerType === 'touch' && clearPointer());
  addEventListener('pointercancel', clearPointer);

  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  new MutationObserver(() => {
    colors = readColors();
    if (!running) draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
