// Hero sky (with lightning from the moon), GPU playground, the dock's copy-email button, the game, and the dock.
(() => {
  const $ = (s) => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = () => Math.min(devicePixelRatio || 1, 2);
  const R = (s) => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ramp = (stops, t) => { t = clamp(t, 0, 1); for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const [p0, c0] = stops[i - 1], [p1, c1] = stops[i]; return mix(c0, c1, (t - p0) / (p1 - p0 || 1)); } return stops[stops.length - 1][1]; };
  // Packs an RGB colour, dimmed by brightness b, into one ImageData pixel (little-endian ABGR).
  const pack = (c, b) => (255 << 24) | ((c[2] * b) << 16) | ((c[1] * b) << 8) | (c[0] * b);
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);

  function noise(seed, n = 128) {
    const r = R(seed), g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = r();
    const f = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      const x0 = ((xi % n) + n) % n, y0 = ((yi % n) + n) % n, x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
      const a = g[y0 * n + x0], b = g[y0 * n + x1], c = g[y1 * n + x0], d = g[y1 * n + x1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
    f.fbm = (x, y) => (f(x, y) * .5 + f(x * 2.03, y * 2.03) * .25 + f(x * 4.1, y * 4.1) * .125) / .875;
    return f;
  }

  // ---------- hero: a quiet dot-matrix night sky ----------
  // One cell is 4 CSS px. The backing store has 2×2 pixels per cell and is scaled up with
  // pixelated rendering; a lit cell writes one of its four pixels, so dots keep a gap between them.
  const hero = $('#top'), copy = $('.hero .copy'), skyCv = $('#sky'), sctx = skyCv.getContext('2d');
  const cloudNoise = noise(3), craterNoise = noise(9, 64);
  // Moon age as a fraction of the synodic month, from a known new moon, so its shape matches tonight's.
  const moonK = (() => { const d = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5; return ((d / 29.530588853) % 1 + 1) % 1; })();
  let S = null, dirty = true, ptr = { x: -1e4, y: -1e4 };
  function buildSky() {
    // Nothing to draw while the hero is hidden or not laid out yet.
    if (hero.clientHeight < 80) { S = null; return; }
    const cols = Math.ceil(hero.clientWidth / 4), rows = Math.ceil(hero.clientHeight / 4);
    skyCv.width = cols * 2; skyCv.height = rows * 2;
    const img = sctx.createImageData(cols * 2, rows * 2), buf = new Uint32Array(img.data.buffer);
    const rnd = new Float32Array(cols * rows), r = R(11); for (let i = 0; i < rnd.length; i++) rnd[i] = r();
    const hb = hero.getBoundingClientRect(), cb = copy.getBoundingClientRect(), bb = $('.hero .ctas').getBoundingClientRect();
    const cr = { x0: (cb.left - hb.left) / 4 - 4, x1: (cb.right - hb.left) / 4 + 4, y0: (cb.top - hb.top) / 4 + 20, y1: (bb.bottom - hb.top) / 4 + 4 };
    // A few flat-bottomed clouds, stamped into a strip twice the sky's width that wraps as it drifts.
    const cw = cols * 2, cloud = new Float32Array(cw * rows), cr3 = R(21);
    for (let k = 0, n = Math.round(cw / 70) + 2; k < n; k++) {
      const ccx = cr3() * cw, base = rows * (.15 + cr3() * .35), size = Math.max(5, rows * (.035 + cr3() * .03));
      const puffs = []; for (let q = 0, m = 3 + ((cr3() * 3) | 0); q < m; q++) puffs.push([(q / (m - 1) - .5) * size * 2.6, -cr3() * size * .6, size * (q === 1 ? 1.05 : .6 + cr3() * .35)]);
      const top = base - size * 2.2;
      for (let y = Math.max(0, Math.floor(top)); y <= base && y < rows; y++) for (let dx = -size * 3.6; dx <= size * 3.6; dx++) {
        const x = Math.round(ccx + dx);
        if (!puffs.some(([px, py, pr]) => Math.hypot(dx - px, (y - base - py) * 1.25) < pr)) continue;
        const shade = .3 + .7 * clamp((base - y) / (base - top), 0, 1) + (cloudNoise(x / 5, y / 3) - .5) * .25;
        const j = y * cw + (((x % cw) + cw) % cw); cloud[j] = Math.max(cloud[j], clamp(shade, .1, 1));
      }
    }
    // The moon sits to the right of the text, or in the top corner on a narrow screen.
    const narrow = cr.x1 > cols * .65, rM = Math.max(5, Math.min(rows * .07, cols * .05));
    const moon = narrow ? [cols * .82, rM + 22] : [cols * .78, rows * .32];
    S = { cols, rows, img, buf, rnd, cr, cloud, cw, rM, moon };
    dirty = true;
  }
  const C = { star: [228, 232, 246], moon: [232, 233, 240], moonDark: [96, 102, 126], cloud: [112, 120, 146], ptr: [190, 204, 232], bolt: [236, 240, 255], lit: [196, 206, 240] };
  // Day: the sun takes the moon's place and the clouds turn into soft white puffs on the sand sky.
  const D = { sky: [231, 216, 193], sun: [255, 192, 102], sunEdge: [242, 136, 72], halo: [255, 186, 112], cloud: [253, 249, 242], ptr: [168, 124, 88], bird: [88, 68, 54] };
  const isDay = () => document.documentElement.dataset.theme === 'light';

  // ---------- lightning from the moon ----------
  // Every 7–16 s a bolt drops from the moon's underside: a jagged walk down the grid that kinks sideways every
  // few cells, with one short branch. It flickers twice and fades in about half a second, lighting up the clouds.
  let bolt = null, nextStrike = performance.now() + 2500 + Math.random() * 3000;
  function makeBolt(t) {
    const { rows, rM, moon } = S, cells = [];
    const walk = (x, y, lean, len, a, branch) => {
      for (let n = 0; n < len && y < rows * .95;) {
        const step = Math.random() < .5 ? lean : (Math.random() < .5 ? -1 : 1) * (Math.random() < .5 ? 0 : 1);
        for (let k = 0, seg = 2 + ((Math.random() * 3) | 0); k < seg && n < len; k++, n++) {
          y++; x += step; cells.push([x, y, a]);
          if (branch && n > len * .25 && Math.random() < .03) { branch = false; walk(x, y, -lean || 1, 6 + Math.random() * 12, .5, false); }
        }
      }
    };
    const lean = Math.random() < .5 ? -1 : 1;
    walk(Math.round(moon[0] + (Math.random() - .5) * rM), Math.round(moon[1] + rM), lean, rows * (.45 + Math.random() * .35), 1, true);
    return { cells, t0: t };
  }
  // Brightness over the strike's life: a flash, a dip, a second flash, then a fade.
  const boltLevel = (dt) => dt < 0 || dt > 560 ? 0 : dt < 70 ? 1 : dt < 130 ? .15 : dt < 210 ? .9 : .9 * (1 - (dt - 210) / 350) ** 1.5;

  // ---------- birds by day ----------
  // The day's counterpart to the lightning: a small group of pixel birds that stays in the sky, gliding a slow
  // figure-eight above the sun (one loop a minute or so), each bobbing on its own and facing the way they fly.
  const FLOCK = [[0, 0], [-4, -2], [-5, 3], [-9, -1]];
  // Wings up (a v) and wings down (a ^), three cells wide.
  const WINGS = [[[-1, -1], [0, 0], [1, -1]], [[-1, 1], [0, 0], [1, 1]]];

  // ---------- day / night cycle ----------
  // skyK is how far the sky is towards day: 0 at night, 1 by day. A switch eases it across in CYCLE ms while the
  // outgoing orb swings down out of the sky and the other swings up into its place, like hands round a clock.
  const CYCLE = 1600, SWING = 1.15;
  let cyc = null, skyK = isDay() ? 1 : 0;
  const easeIO = (p) => p < .5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
  function skyState(t) {
    if (cyc && t - cyc.t0 >= CYCLE) cyc = null;
    if (!cyc) { const day = isDay(); return { k: day ? 1 : 0, orbs: [{ sun: day, a: 0 }] }; }
    const e = easeIO(clamp((t - cyc.t0) / CYCLE, 0, 1)), toDay = cyc.to === 'light';
    return { k: toDay ? e : 1 - e, orbs: [{ sun: !toDay, a: e * SWING }, { sun: toDay, a: (e - 1) * SWING }] };
  }

  function drawSky(t) {
    if (!S) return;
    const { cols, rows, buf, rnd, cr, cloud, cw, rM, moon } = S; buf.fill(0);
    const drift = reduce ? 0 : Math.floor(t / 1400) % cw, W = cols * 2, pR = 16;
    const { k, orbs } = skyState(t); skyK = k;
    // A dim dot fades towards the sky behind it: black at night, the sand colour by day, and in between mid-switch.
    const low = mix([0, 0, 0], D.sky, k), shade = (c, b) => pack(mix(low, c, b), 1);
    if (!reduce && k === 0 && t > nextStrike) { bolt = makeBolt(t); nextStrike = t + 7000 + Math.random() * 9000; }
    const strike = bolt && k === 0 ? boltLevel(t - bolt.t0) : 0, flash = strike * .7;
    const cloudCol = mix(C.cloud, D.cloud, k), ptrCol = mix(C.ptr, D.ptr, k);
    // The sun's rays turn slowly, one revolution every few minutes.
    const spin = reduce ? 0 : t * .00004;
    // Each orb hangs at the top of a circle centred far below it, so swinging it round sets or raises it.
    const R = rows * .9;
    const at = orbs.map((o) => ({ sun: o.sun, x: moon[0] + R * Math.sin(o.a), y: moon[1] + R - R * Math.cos(o.a) }));
    for (let y = 0; y < rows; y++) {
      // The sky fades out towards the bottom of the hero so it melts into the page.
      const fade = 1 - sm(.6, 1, y / rows);
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x, inText = x > cr.x0 && x < cr.x1 && y > cr.y0 && y < cr.y1;
        let I = 0, col = null, big = false;
        const c = cloud[y * cw + ((x + drift) % cw)];
        if (c > 0 && !inText) { I = c * (.55 + .2 * k + .5 * flash); col = flash > .02 ? mix(C.cloud, C.lit, flash) : cloudCol; }
        if (k < 1 && c < .1 && rnd[i] < .004 && !inText) {
          const s = .45 + .45 * Math.sin(t * .001 * (.4 + rnd[i] * 60) + rnd[i] * 999);
          if (s > .3) { I = .9 * (1 - k); col = C.star; }
        }
        for (const o of at) {
          if (inText) break;
          const dx = (x - o.x) / rM, dy = (y - o.y) / rM, d = Math.hypot(dx, dy);
          if (d > 2.6) continue;
          if (o.sun) {
            // A full disc, warmer towards its rim, then a soft halo crossed by twelve slowly turning rays.
            if (d < 1.05) { I = 1; col = mix(D.sun, D.sunEdge, d * d * .8); big = true; }
            else {
              const halo = .3 * Math.exp(-(d - 1) * 1.5);
              const ray = d < 2.4 && ((Math.atan2(dy, dx) / (2 * Math.PI) + spin) * 12 % 1 + 1) % 1 < .2 ? .85 * (1 - (d - 1.05) / 1.35) : 0;
              const h = Math.max(halo, ray);
              if (h > I) { I = h; col = D.halo; }
            }
          } else if (d < 1) {
            // Lit or dark side of the terminator for the current moon phase.
            const edge = Math.sqrt(1 - dy * dy) * Math.cos(2 * Math.PI * moonK);
            const lit = moonK < .5 ? dx > edge : dx < -edge;
            // Solid lit side with soft grey patches for craters; the dark side stays faintly visible.
            const crater = sm(.5, .68, craterNoise.fbm(dx * 2.2 + 9, dy * 2.2 + 9));
            I = lit ? 1 : .32; col = lit ? mix(C.moon, [176, 180, 196], crater) : C.moonDark; big = lit;
          } else if (d < 2.4) { const h = .12 * Math.exp(-(d - 1) * 1.8); if (h > I) { I = h; col = C.moon; } }
        }
        const pd = Math.hypot(x - ptr.x, y - ptr.y);
        if (pd < pR) { I += .3 * (1 - pd / pR) ** 2; if (!col) col = ptrCol; }
        I *= fade;
        if (col && I > BAYER[(y & 3) * 4 + (x & 3)]) {
          const p = shade(col, .5 + .5 * Math.min(1, I)), o = y * 2 * W + x * 2;
          buf[o] = p; if (big) { buf[o + 1] = p; buf[o + W] = p; buf[o + W + 1] = p; }
        }
      }
    }
    // Birds: one dark pixel per cell, so they stay small and thin; they keep out of the text.
    // They follow the sun, so they swing away with it and fade out during a switch to night.
    const sun = at.find((o) => o.sun);
    if (sun && k > 0) {
      const th = reduce ? 0 : t * .00011, dir = Math.cos(th) >= 0 ? 1 : -1;
      const gx = sun.x + rM * 2.4 * Math.sin(th), gy = sun.y - rM * 1.5 + rM * .9 * Math.sin(2 * th);
      for (let b = 0; b < FLOCK.length; b++) {
        const [ox, oy] = FLOCK[b], wob = reduce ? 0 : t * .0013 + b * 1.9;
        const bx = Math.round(gx + dir * ox + Math.sin(wob) * 1.5), by = Math.round(gy + oy + Math.cos(wob * 1.3) * 1.2);
        for (const [wx, wy] of WINGS[reduce ? 0 : ((t / 210 + b * 1.7) | 0) % 2]) {
          const x = bx + wx * dir, y = by + wy;
          if (x < 0 || x >= cols || y < 0 || y >= rows || (x > cr.x0 && x < cr.x1 && y > cr.y0 && y < cr.y1)) continue;
          buf[y * 2 * W + x * 2] = shade(D.bird, .75 * k);
        }
      }
    }
    // The bolt: solid cells for the core, single dim pixels either side for its glow. It stays out of the text.
    if (strike > 0) for (const [x, y, a] of bolt.cells) {
      if (x < 1 || x >= cols - 1 || y < 0 || y >= rows || (x > cr.x0 && x < cr.x1 && y > cr.y0 && y < cr.y1)) continue;
      const b = strike * a * (1 - sm(.6, 1, y / rows));
      if (b < .05) continue;
      const p = pack(C.bolt, .35 + .65 * b), g = pack(C.lit, .45 * b), o = y * 2 * W + x * 2;
      buf[o] = buf[o + 1] = buf[o + W] = buf[o + W + 1] = p;
      if (!buf[o - 2]) buf[o - 2] = g;
      if (!buf[o + 3]) buf[o + 3] = g;
    }
    sctx.putImageData(S.img, 0, 0);
  }
  // Is a pointer event over the moon (or sun)? It doubles as the day/night toggle.
  const onOrb = (e) => {
    if (!S) return false;
    const b = hero.getBoundingClientRect(), x = (e.clientX - b.left) / 4, y = (e.clientY - b.top) / 4;
    return Math.hypot(x - S.moon[0], y - S.moon[1]) < S.rM * 1.4;
  };
  hero.addEventListener('pointermove', (e) => {
    const b = hero.getBoundingClientRect(); ptr = { x: (e.clientX - b.left) / 4, y: (e.clientY - b.top) / 4 }; dirty = true;
    hero.style.cursor = onOrb(e) ? 'pointer' : '';
  });
  hero.addEventListener('pointerleave', () => { ptr = { x: -1e4, y: -1e4 }; dirty = true; });
  hero.addEventListener('click', (e) => { if (!cyc && onOrb(e)) toggleTheme(); });

  // ---------- day / night ----------
  // The choice is remembered; without one, BaseLayout picks by the visitor's local time.
  const themeBtn = $('#theme');
  const labelTheme = () => themeBtn.setAttribute('aria-label', isDay() ? 'Switch to night' : 'Switch to day');
  // The page colours fade over the same time the sky takes to swing round (CSS reads --theme-fade).
  function toggleTheme() {
    if (cyc) return;
    const next = isDay() ? 'dark' : 'light', root = document.documentElement;
    if (!reduce && vis.hero) cyc = { t0: performance.now(), to: next };
    root.style.setProperty('--theme-fade', `${cyc ? CYCLE : 500}ms`);
    root.classList.add('theme-fade');
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
    $('meta[name="theme-color"]').content = next === 'light' ? '#ece4d6' : '#090b10';
    labelTheme(); dirty = true;
    dispatchEvent(new CustomEvent('themechange', { detail: next }));
    setTimeout(() => root.classList.remove('theme-fade'), (cyc ? CYCLE : 500) + 100);
  }
  themeBtn.addEventListener('click', toggleTheme);
  labelTheme();

  // ---------- hero: drifting particles that fall into the pointer's gravity well ----------
  // Particles drift and link up when close; near the pointer they are pulled in and swirl
  // around it, and a hard core pushes them back out so they orbit instead of collapsing.
  // Kept faint: small square dots in the page's blue / red / yellow and dotted moonlit threads, to sit with the dotted sky.
  const grav = $('#gravity'), gctx2 = grav.getContext('2d');
  const coarse = matchMedia('(pointer: coarse)').matches;
  const GCOL = ['#7ea2ff', '#ff6b8b', '#ffc35c'], LINK = 110, WELL = coarse ? 200 : 280, CORE = 64, MAX_SPEED = 3;
  // By day the particles become dust in the sunlight, after React Bits' Swarm Cursor but far lighter: a few
  // hundred tiny warm motes that drift and float upward, and near the pointer gather into a loose swirling
  // cloud that trails after it. Each mote has its own orbit round the pointer, so the cloud never clumps.
  const DUST = ['#7a5a40', '#94683f', '#a86e55', '#6b5444', '#fff6e4'], SWARM = coarse ? 220 : 300;
  let gw = 0, gh = 0, parts = [], dust = [];
  const well = { x: -9999, y: -9999 };
  function sizeGravity() {
    const dpr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
    gw = hero.clientWidth; gh = hero.clientHeight;
    grav.width = Math.round(gw * dpr); grav.height = Math.round(gh * dpr); gctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(70, (gw * gh) / (coarse ? 22000 : 16000)));
    parts = Array.from({ length: n }, () => ({ x: Math.random() * gw, y: Math.random() * gh, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() < .3 ? 2 : 1.5, a: .3 + Math.random() * .35, c: (Math.random() * GCOL.length) | 0 }));
    const m = Math.round(Math.min(220, (gw * gh) / (coarse ? 6000 : 4500)));
    dust = Array.from({ length: m }, () => ({
      x: Math.random() * gw, y: Math.random() * gh, vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .6,
      r: .7 + Math.random() ** 2 * 1.3, a: .4 + Math.random() * .4, c: (Math.random() * DUST.length) | 0,
      orbit: 14 + Math.random() ** .7 * 110, ang: Math.random() * Math.PI * 2, spin: (Math.random() < .5 ? -1 : 1) * (.006 + Math.random() * .018),
      tw: Math.random() * 6.3
    }));
  }
  function drawDust(c, active, alpha, t) {
    for (const p of dust) {
      // Brownian drift with a slight lift, as dust rides warm air.
      p.vx += (Math.random() - .5) * .03; p.vy += (Math.random() - .5) * .03 - .0025;
      if (active) {
        const d = Math.hypot(well.x - p.x, well.y - p.y);
        if (d < SWARM) {
          // Pulled towards its own point on an orbit round the pointer, harder the closer it already is.
          p.ang += p.spin;
          const tx = well.x + Math.cos(p.ang) * p.orbit, ty = well.y + Math.sin(p.ang) * p.orbit * .8, w = (.3 + .7 * (1 - d / SWARM)) * .02;
          p.vx += (tx - p.x) * w; p.vy += (ty - p.y) * w;
        }
      }
      p.vx *= .95; p.vy *= .95;
      const sp = Math.hypot(p.vx, p.vy); if (sp > 3) { p.vx *= 3 / sp; p.vy *= 3 / sp; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -4) p.x = gw + 4; else if (p.x > gw + 4) p.x = -4;
      if (p.y < -4) p.y = gh + 4; else if (p.y > gh + 4) p.y = -4;
      if (alpha <= 0) continue;
      // A slow twinkle, as each mote turns through the light.
      c.globalAlpha = alpha * p.a * (.55 + .45 * Math.sin(t * .0015 + p.tw));
      c.fillStyle = DUST[p.c];
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fill();
    }
  }
  function drawGravity(t) {
    const c = gctx2, active = well.x > -999, night = 1 - skyK;
    c.clearRect(0, 0, gw, gh);
    drawDust(c, active, skyK, t);
    c.globalAlpha = 1;
    if (night <= 0) return;
    if (active) {
      const g = c.createRadialGradient(well.x, well.y, 0, well.x, well.y, WELL * .6);
      g.addColorStop(0, `rgba(200,212,240,${.05 * night})`); g.addColorStop(1, 'rgba(200,212,240,0)');
      c.fillStyle = g; c.fillRect(well.x - WELL, well.y - WELL, WELL * 2, WELL * 2);
    }
    for (const p of parts) {
      if (active) {
        const dx = well.x - p.x, dy = well.y - p.y, d = Math.hypot(dx, dy) || 1;
        if (d < WELL) {
          // A floor on the pull, so particles at the edge of the well start moving at once instead of creeping in.
          const pull = d < CORE ? -.09 : (.25 + .75 * (1 - d / WELL)) * .09;
          p.vx += (dx / d) * pull + (-dy / d) * .012; p.vy += (dy / d) * pull + (dx / d) * .012;
        }
      }
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > MAX_SPEED) { p.vx *= MAX_SPEED / sp; p.vy *= MAX_SPEED / sp; }
      // Ease back to a lazy drift once the pointer leaves.
      if (sp > .35) { const damp = active ? .985 : .97; p.vx *= damp; p.vy *= damp; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > gw) p.vx *= -1;
      if (p.y < 0 || p.y > gh) p.vy *= -1;
      p.x = clamp(p.x, 0, gw); p.y = clamp(p.y, 0, gh);
    }
    c.lineWidth = 1; c.setLineDash([1, 4]); c.strokeStyle = '#c9d3ea';
    if (active) {
      for (const p of parts) {
        const d = Math.hypot(well.x - p.x, well.y - p.y);
        if (d < WELL * .6) { c.globalAlpha = (1 - d / (WELL * .6)) * .22 * night; c.beginPath(); c.moveTo(well.x, well.y); c.lineTo(p.x, p.y); c.stroke(); }
      }
    }
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i], b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 < LINK * LINK) { c.globalAlpha = (1 - Math.sqrt(d2) / LINK) * .14 * night; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
    }
    c.setLineDash([]);
    // Square dots on a 2px grid, like the pixels of the moon.
    for (const p of parts) { c.globalAlpha = p.a * night; c.fillStyle = GCOL[p.c]; c.fillRect(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, p.r, p.r); }
    c.globalAlpha = 1;
  }
  // Tracked on the window so the well follows the pointer to the screen edges; on touch it lets go when the finger lifts.
  const setWell = (e) => {
    const b = grav.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    if (x < 0 || y < 0 || x > b.width || y > b.height) { well.x = well.y = -9999; return; }
    well.x = x; well.y = y;
  };
  const clearWell = () => { well.x = well.y = -9999; };
  addEventListener('pointermove', setWell, { passive: true });
  addEventListener('pointerdown', setWell, { passive: true });
  addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') clearWell(); });
  addEventListener('pointercancel', clearWell);
  document.documentElement.addEventListener('pointerleave', clearWell);

  // ---------- GPU playground: up to a million points, splatted into a pixel buffer ----------
  const N = 1000000, P = new Float32Array(N * 2), CL = new Uint8Array(N), classCount = [0, 0, 0];
  const coast = (x) => .2 + x * .5 + Math.sin(x * 9) * .03;
  (() => {
    const r = R(42), roads = [], districts = [];
    for (let i = 0; i < 26; i++) {
      let x = r(), y = coast(x) + .05 + r() * (1 - coast(x)), a = r() * 6.28; const pts = [];
      for (let s = 0; s < 60; s++) { pts.push(x, y); a += (r() - .5) * .35; x += Math.cos(a) * .012; y += Math.sin(a) * .012; }
      roads.push(pts);
    }
    while (districts.length < 14) { const x = .05 + r() * .9, y = .1 + r() * .88; if (y > coast(x) + .05) districts.push([x, y, .03 + r() * .07]); }
    for (let i = 0; i < N; i++) {
      let x, y, k; const t = r();
      if (t < .2) { const u = r(); x = u; y = coast(u) + (r() - .5) * .022; k = 0; }
      else if (t < .56) {
        // Anywhere along a road segment, not just its vertices, so roads read as lines.
        const rd = roads[(r() * roads.length) | 0], j = ((r() * 59) | 0) * 2, u = r();
        x = rd[j] + (rd[j + 2] - rd[j]) * u + (r() - .5) * .004; y = rd[j + 1] + (rd[j + 3] - rd[j + 1]) * u + (r() - .5) * .004; k = 1;
        if (y < coast(x)) k = -1; // roads stop at the water
      } else k = -1;
      if (k === -1) {
        // Gaussian falloff so districts fade out instead of ending in a hard disc.
        const d = districts[(r() * districts.length) | 0], gx = (r() + r() + r() - 1.5) * 1.2, gy = (r() + r() + r() - 1.5) * 1.2;
        x = d[0] + gx * d[2]; y = d[1] + gy * d[2] * .8; k = 2;
      }
      P[i * 2] = x; P[i * 2 + 1] = y; CL[i] = k; classCount[k]++;
    }
  })();
  const short = (n) => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'M' : Math.round(n / 1e3) + 'k';
  [0, 1, 2].forEach((k) => $('#c' + k).textContent = short(classCount[k]));
  // Dark land and sea; point density glows from blue through red and yellow to white.
  const LUT = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) { const c = ramp([[0, [34, 44, 120]], [.3, [80, 120, 255]], [.56, [255, 84, 128]], [.8, [255, 196, 92]], [1, [255, 248, 226]]], i / 255); LUT.set(c.map(Math.round), i * 3); }
  const map = $('#map'), mctx = map.getContext('2d');
  const slider = $('#n'), countEl = $('#count'), msEl = $('#ms');
  const layers = [0, 1, 2].map((k) => $('#l' + k));
  let mw = 0, mh = 0, dens = null, count = N, z = 1, cx = .5, cy = .5, pending = false;
  const sliderToCount = (v) => Math.round(Math.pow(10, 4 + (v / 100) * 2));
  function sizeMap() {
    const dpr = DPR(); mw = Math.max(1, Math.round(map.clientWidth * dpr)); mh = Math.max(1, Math.round(map.clientHeight * dpr));
    map.width = mw; map.height = mh; dens = new Uint32Array(mw * mh); render();
  }
  function render() {
    pending = false;
    const t0 = performance.now(), on = layers.map((l) => l.checked), step = N / count;
    dens.fill(0);
    const zx = z * mw, zy = z * mh, ox = (.5 - cx * z) * mw, oy = (.5 - cy * z) * mh;
    let shown = 0;
    for (let f = 0; f < N; f += step) {
      const i = f | 0; if (!on[CL[i]]) continue;
      const fx = P[i * 2] * zx + ox, fy = P[i * 2 + 1] * zy + oy;
      if (fx < 0 || fy < 0 || fx >= mw || fy >= mh) continue;
      dens[(fy | 0) * mw + (fx | 0)]++; shown++;
    }
    let max = 1; for (let p = 0; p < dens.length; p++) if (dens[p] > max) max = dens[p];
    const img = mctx.createImageData(mw, mh), d = img.data, norm = Math.log1p(max);
    for (let py = 0, p = 0; py < mh; py++) {
      const wy = cy + (py / mh - .5) / z;
      for (let px = 0; px < mw; px++, p++) {
        const o = p * 4, v = dens[p];
        if (v) { const li = Math.min(255, (Math.pow(Math.log1p(v) / norm, .85) * 235 + 20) | 0) * 3; d[o] = LUT[li]; d[o + 1] = LUT[li + 1]; d[o + 2] = LUT[li + 2]; }
        else { const wx = cx + (px / mw - .5) / z; if (wy < coast(wx)) { d[o] = 11; d[o + 1] = 19; d[o + 2] = 30; } else { d[o] = 19; d[o + 1] = 21; d[o + 2] = 27; } }
        d[o + 3] = 255;
      }
    }
    mctx.putImageData(img, 0, 0);
    countEl.textContent = shown.toLocaleString('en-US');
    msEl.textContent = Math.max(1, Math.round(performance.now() - t0)) + ' ms';
  }
  const queue = () => { if (!pending) { pending = true; requestAnimationFrame(render); } };
  slider.addEventListener('input', () => { count = sliderToCount(+slider.value); queue(); });
  layers.forEach((l) => l.addEventListener('change', queue));
  let drag = null;
  map.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; map.setPointerCapture(e.pointerId); map.classList.add('dragging'); });
  map.addEventListener('pointermove', (e) => {
    if (!drag) return;
    cx -= (e.clientX - drag.x) / (map.clientWidth * z); cy -= (e.clientY - drag.y) / (map.clientHeight * z);
    cx = clamp(cx, -.2, 1.2); cy = clamp(cy, -.2, 1.2); drag = { x: e.clientX, y: e.clientY }; queue();
  });
  const endDrag = () => { drag = null; map.classList.remove('dragging'); };
  map.addEventListener('pointerup', endDrag); map.addEventListener('pointercancel', endDrag);
  function zoomAt(f, mx = .5, my = .5) {
    const wx = cx + (mx - .5) / z, wy = cy + (my - .5) / z; z = clamp(z * f, 1, 40);
    cx = wx - (mx - .5) / z; cy = wy - (my - .5) / z; queue();
  }
  map.addEventListener('dblclick', (e) => { const b = map.getBoundingClientRect(); zoomAt(e.shiftKey ? 1 / 2 : 2, (e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height); });
  // Trackpad pinch arrives as a wheel event with ctrlKey; plain wheel keeps scrolling the page.
  map.addEventListener('wheel', (e) => { if (!e.ctrlKey) return; e.preventDefault(); const b = map.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * .01), (e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height); }, { passive: false });
  $('#zin').addEventListener('click', () => zoomAt(1.8));
  $('#zout').addEventListener('click', () => zoomAt(1 / 1.8));
  $('#reset').addEventListener('click', () => { z = 1; cx = cy = .5; slider.value = 100; count = N; layers.forEach((l) => l.checked = true); queue(); });

  // ---------- Frazer thumbnail: a 10-band EQ curve ----------
  (() => {
    const svg = $('#eq'); if (!svg) return;
    const gains = [3, 4.5, 3.5, 1, -1, -1.5, 0, 2, 3.5, 2.5], W = 440, padX = 24, mid = 62, k = 8;
    const step = (W - padX * 2) / 9, pts = gains.map((g, i) => [padX + i * step, mid - g * k]);
    let d = `M${pts[0]}`; for (let i = 1; i < 10; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], c = (x0 + x1) / 2; d += ` C${c},${y0} ${c},${y1} ${x1},${y1}`; }
    // Neutral colours come from the theme variables (via style, since SVG attributes can't read them).
    const grid = pts.map(([x]) => `<line x1="${x}" y1="14" x2="${x}" y2="112" style="stroke:var(--line)"/>`).join('');
    const lab = ['31', '62', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'].map((l, i) => `<text x="${pts[i][0]}" y="127" style="fill:var(--dim)" font-size="10" font-family="Geist Mono, monospace" text-anchor="middle">${l}</text>`).join('');
    const dots = pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" style="fill:var(--bg2)" stroke="url(#eqs)" stroke-width="2"/>`).join('');
    svg.innerHTML = `<defs><linearGradient id="eqs" x1="0" x2="1"><stop offset="0" stop-color="#6f9bff"/><stop offset=".52" stop-color="#ff5e7e"/><stop offset="1" stop-color="#ffc35c"/></linearGradient><linearGradient id="eqf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5e7e" stop-opacity=".22"/><stop offset="1" stop-color="#6f9bff" stop-opacity="0"/></linearGradient></defs>${grid}<line x1="${padX}" y1="${mid}" x2="${W - padX}" y2="${mid}" style="stroke:var(--line2)" stroke-dasharray="3 4"/><path d="${d} L${W - padX},112 L${padX},112Z" fill="url(#eqf)"/><path d="${d}" fill="none" stroke="url(#eqs)" stroke-width="2.4"/>${dots}${lab}`;
  })();

  // ---------- copy email ----------
  document.querySelectorAll('.copy-email').forEach((btn) => btn.addEventListener('click', async () => {
    // The dock button has no label, so its tooltip carries the feedback instead.
    const lbl = btn.querySelector('.lbl'), email = $('#email');
    const say = (t) => { if (lbl) lbl.textContent = t; else btn.dataset.tip = t; };
    try { await navigator.clipboard.writeText(email.textContent); say('Copied'); }
    catch { const s = getSelection(), rg = document.createRange(); rg.selectNodeContents(email); s.removeAllRanges(); s.addRange(rg); email.scrollIntoView({ block: 'center' }); say('Selected · ⌘C'); }
    setTimeout(() => say('Copy email'), 2200);
  }));

  // ---------- game: light up the city ----------
  const gcv = $('#game'), gctx = gcv.getContext('2d');
  const hudPct = $('#litpct'), hudTime = $('#time'), hudBest = $('#best'), gstart = $('#gstart'), gwin = $('#gwin');
  const BEST_KEY = 'samak-lightup-best';
  const readBest = () => { try { const v = parseFloat(localStorage.getItem(BEST_KEY)); return isFinite(v) ? v : null; } catch { return null; } };
  const writeBest = (v) => { try { localStorage.setItem(BEST_KEY, String(v)); } catch {} };
  // Lit windows and sparks share the page's blue / red / yellow mix.
  const GLOW = [[126, 162, 255], [255, 104, 136], [255, 200, 104]], SPARK = ['#a9c0ff', '#ff8fa6', '#ffd58a'];
  let G = null;
  function newGame() {
    const w = gcv.clientWidth, h = gcv.clientHeight, dpr = DPR(); if (w < 2 || h < 2) return;
    gcv.width = Math.round(w * dpr); gcv.height = Math.round(h * dpr); gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = R(5), ground = Math.round(h * .78), pitch = w < 500 ? 7 : 8, blds = [], wins = [];
    for (let x = 4; x < w - 6;) {
      const bw = (2 + ((r() * 4) | 0)) * pitch + 4, bh = Math.round(h * (.12 + r() * .33));
      blds.push({ x, w: bw, h: bh });
      for (let wy = ground - bh + 8; wy <= ground - 10; wy += pitch) for (let wx = x + 4; wx + 4 <= x + bw - 3; wx += pitch) wins.push({ x: wx, y: wy, lit: 0, on: false, c: GLOW[(r() * 3) | 0] });
      x += bw + 3 + r() * 8;
    }
    const stars = []; for (let i = 0; i < 70; i++) stars.push([r() * w, r() * ground * .6, r()]);
    const goal = Math.round(wins.length * .7);
    G = { w, h, ground, blds, wins, stars, sparks: [], parts: [], boat: w / 2, target: w / 2, keys: {}, state: 'ready', time: 0, lit: 0, goal, per: Math.max(2, Math.ceil(goal / 30)), spawn: 0, last: performance.now(), fw: 0 };
    gstart.hidden = false; gwin.hidden = true; updateHud();
  }
  function updateHud() {
    hudPct.textContent = Math.round(Math.min(1, G.lit / G.goal) * 100) + '%';
    hudTime.textContent = G.time.toFixed(1) + 's';
    const b = readBest(); hudBest.textContent = b ? b.toFixed(1) + 's' : '–';
  }
  const startGame = () => { if (G && G.state === 'ready') { G.state = 'run'; gstart.hidden = true; } };
  function lightWindows(n) {
    const off = G.wins.filter((w) => !w.on);
    for (let k = 0; k < n && off.length; k++) { const j = (Math.random() * off.length) | 0; off[j].on = true; off.splice(j, 1); G.lit++; }
    if (G.lit >= G.goal && G.state === 'run') {
      G.state = 'won';
      const best = readBest(), t = G.time, rec = best === null || t < best; if (rec) writeBest(t);
      $('#wintext').textContent = `You lit the city in ${t.toFixed(1)} seconds.` + (rec ? ' Your best yet.' : ` Your best is ${best.toFixed(1)}s.`);
      setTimeout(() => { if (G.state === 'won') gwin.hidden = false; }, 1200);
      updateHud();
    }
  }
  const burst = (x, y, n, cols, sp, life) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = sp * (.3 + Math.random() * .7); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, c: cols[(Math.random() * cols.length) | 0] }); } };
  function stepGame(now) {
    const dt = Math.min(.05, (now - G.last) / 1000); G.last = now;
    const { w, h, ground } = G, boatY = ground + (h - ground) * .42;
    if (G.keys.ArrowLeft) G.target -= 460 * dt;
    if (G.keys.ArrowRight) G.target += 460 * dt;
    G.target = clamp(G.target, 30, w - 30); G.boat += (G.target - G.boat) * Math.min(1, dt * 12);
    if (G.state === 'run') {
      G.time += dt;
      const prog = G.lit / G.goal;
      G.spawn -= dt;
      if (G.spawn <= 0) { G.spawn = .62 - .25 * prog; G.sparks.push({ x: 24 + Math.random() * (w - 48), y: -10, vy: 80 + Math.random() * 50 + prog * 70, c: SPARK[(Math.random() * 3) | 0] }); }
      updateHud();
    }
    for (let i = G.sparks.length - 1; i >= 0; i--) {
      const s = G.sparks[i]; s.y += s.vy * dt;
      if (s.y > boatY - 12 && s.y < boatY + 6 && Math.abs(s.x - G.boat) < 32) {
        G.sparks.splice(i, 1); burst(s.x, boatY - 10, 12, [s.c, '#ffffff'], 120, .6);
        if (G.state === 'run') lightWindows(G.per);
      } else if ((s.y > ground + 4 && Math.abs(s.x - G.boat) >= 32) || s.y > h) G.sparks.splice(i, 1);
    }
    if (G.state === 'won') { G.fw -= dt; if (G.fw <= 0) { G.fw = .3; burst(w * (.15 + Math.random() * .7), ground * (.15 + Math.random() * .35), 40, [...SPARK, '#ffffff'], 180, 1.2); } }
    for (let i = G.parts.length - 1; i >= 0; i--) { const p = G.parts[i]; p.life -= dt; if (p.life <= 0) { G.parts.splice(i, 1); continue; } p.vy += 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    G.wins.forEach((wn) => { if (wn.on && wn.lit < 1) wn.lit = Math.min(1, wn.lit + dt * 3); });

    const c = gctx, t = now / 1000;
    const g = c.createLinearGradient(0, 0, 0, ground); g.addColorStop(0, '#06070b'); g.addColorStop(1, '#101626');
    c.fillStyle = g; c.fillRect(0, 0, w, ground);
    G.stars.forEach(([x, y, k]) => { c.fillStyle = `rgba(230,234,246,${.25 + .4 * (.5 + .5 * Math.sin(t * (1 + k * 2) + k * 50))})`; c.fillRect(x | 0, y | 0, 2, 2); });
    c.fillStyle = '#141824'; G.blds.forEach((b) => c.fillRect(b.x, ground - b.h, b.w, b.h));
    G.wins.forEach((wn) => {
      if (wn.lit > 0) { c.fillStyle = `rgba(${wn.c},${.16 * wn.lit})`; c.fillRect(wn.x - 3, wn.y - 3, 10, 10); }
      c.fillStyle = wn.lit > 0 ? `rgb(${36 + (wn.c[0] - 36) * wn.lit | 0},${40 + (wn.c[1] - 40) * wn.lit | 0},${54 + (wn.c[2] - 54) * wn.lit | 0})` : '#232838';
      c.fillRect(wn.x, wn.y, 4, 4);
    });
    c.fillStyle = '#080b13'; c.fillRect(0, ground, w, h - ground);
    c.fillStyle = 'rgba(92,134,184,.3)';
    for (let y = ground + 4; y < h; y += 6) for (let x = ((y * 7 + t * 20) % 14) - 14; x < w; x += 14) c.fillRect(x, y, 6, 1);
    G.sparks.forEach((s) => {
      c.fillStyle = s.c; for (let k = 1; k <= 4; k++) { c.globalAlpha = .5 - k * .1; c.fillRect(s.x - 1.5, s.y - k * 7, 3, 3); }
      c.globalAlpha = 1; c.beginPath(); c.arc(s.x, s.y, 3.2, 0, 6.283); c.fill();
    });
    // The boat: a hull, a canopy on posts, and a lantern that catches the sparks.
    const bx = G.boat, by = boatY + Math.sin(t * 2.2) * 1.5;
    c.fillStyle = '#5d6b8a'; c.beginPath(); c.moveTo(bx - 34, by); c.lineTo(bx + 34, by); c.lineTo(bx + 26, by + 10); c.lineTo(bx - 26, by + 10); c.closePath(); c.fill();
    c.fillStyle = '#d9d2c3'; c.fillRect(bx - 26, by - 16, 52, 3); c.fillRect(bx - 23, by - 13, 2, 13); c.fillRect(bx + 21, by - 13, 2, 13);
    const lg = c.createRadialGradient(bx, by - 22, 0, bx, by - 22, 26); lg.addColorStop(0, 'rgba(184,202,255,.5)'); lg.addColorStop(1, 'rgba(184,202,255,0)');
    c.fillStyle = lg; c.fillRect(bx - 26, by - 48, 52, 52);
    c.fillStyle = '#d4e0ff'; c.fillRect(bx - 3, by - 25, 6, 7);
    G.parts.forEach((p) => { c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.c; c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }); c.globalAlpha = 1;
  }
  gcv.addEventListener('pointermove', (e) => { if (!G) return; G.target = e.clientX - gcv.getBoundingClientRect().left; startGame(); });
  gcv.addEventListener('pointerdown', (e) => { if (!G) return; G.target = e.clientX - gcv.getBoundingClientRect().left; startGame(); });
  gcv.addEventListener('keydown', (e) => { if (!G || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return; e.preventDefault(); G.keys[e.key] = true; startGame(); });
  gcv.addEventListener('keyup', (e) => { if (G) G.keys[e.key] = false; });
  $('#again').addEventListener('click', () => { newGame(); gcv.focus(); });

  // ---------- visibility (the nav highlight and the reveals live in effects.js) ----------
  const vis = { hero: true, game: false };
  const io = new IntersectionObserver((es) => es.forEach((e) => { vis[e.target.dataset.vis] = e.isIntersecting; }), { rootMargin: '80px' });
  hero.dataset.vis = 'hero'; $('.game').dataset.vis = 'game';
  io.observe(hero); io.observe($('.game'));

  // The dock slides in once the hero is mostly out of view.
  const dock = $('#dock');
  const onScroll = () => dock.classList.toggle('show', scrollY > innerHeight * .55);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  let lastSky = 0;
  function frame(now) {
    // Every frame while day and night are swapping, so the orbs move smoothly; otherwise 20 times a second.
    if (vis.hero && (dirty || cyc || (!reduce && now - lastSky > 50))) { drawSky(now); lastSky = now; dirty = false; }
    if (vis.hero && !reduce && !document.hidden) drawGravity(now);
    if (G) { if (vis.game) stepGame(now); else G.last = now; }
    requestAnimationFrame(frame);
  }

  let lastW = 0;
  function layout() {
    const w = innerWidth; if (w === lastW) return; lastW = w;
    buildSky(); sizeGravity(); sizeMap(); newGame();
  }
  layout();
  document.fonts && document.fonts.ready.then(() => { lastW = 0; layout(); });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
  requestAnimationFrame(frame);
})();
