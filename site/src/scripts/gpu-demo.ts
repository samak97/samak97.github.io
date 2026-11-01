// GPU playground: up to 1M animated map markers.
// GPU mode: every marker lives in one vertex buffer and is drawn with a single drawArrays call;
// all motion happens in the vertex shader, so the CPU does no per-marker work per frame.
// CPU mode: the naive approach, one canvas path + fill per marker, to show the difference.

const MAX = 1_000_000;
const WORLD_X = 1.78; // world spans [-WORLD_X, WORLD_X] x [-1, 1]

const VERT = `
attribute vec4 a_data; // x, y, seed, cluster
uniform vec2 u_scale;
uniform vec2 u_offset;
uniform float u_time;
uniform float u_size;
uniform float u_alpha;
varying vec3 v_color;
varying float v_alpha;

void main() {
  float seed = a_data.z;
  float c = a_data.w;
  vec2 p = a_data.xy;
  float ph = seed * 6.2831;
  p += vec2(sin(u_time * 0.6 + ph), cos(u_time * 0.5 + ph * 1.3)) * 0.006;
  gl_Position = vec4((p + u_offset) * u_scale, 0.0, 1.0);

  float pulse = 1.0 + 0.35 * sin(u_time * 2.2 + seed * 40.0);
  gl_PointSize = u_size * (0.7 + 0.6 * fract(seed * 13.7)) * pulse;

  vec3 teal = vec3(0.37, 0.92, 0.83);
  vec3 blue = vec3(0.49, 0.61, 1.0);
  vec3 violet = vec3(0.66, 0.55, 0.98);
  vec3 col = mix(teal, blue, smoothstep(0.0, 0.5, c));
  col = mix(col, violet, smoothstep(0.5, 1.0, c));
  if (fract(seed * 97.31) > 0.975) col = vec3(0.96, 0.72, 0.31); // hotspots
  v_color = col;
  v_alpha = u_alpha * (0.6 + 0.4 * pulse);
}`;

const FRAG = `
precision mediump float;
varying vec3 v_color;
varying float v_alpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.15, d) * v_alpha;
  gl_FragColor = vec4(v_color * a, a);
}`;

const CPU_COLORS = ['#5eead4', '#6fc7f0', '#7c9cff', '#9586fb', '#a78bfa'];

function gaussian() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Clustered "cities" plus background noise, shuffled so any prefix is representative. */
function generate(): Float32Array {
  const data = new Float32Array(MAX * 4);
  const clusters = Array.from({ length: 70 }, () => ({
    x: (Math.random() * 2 - 1) * WORLD_X * 0.9,
    y: (Math.random() * 2 - 1) * 0.85,
    s: 0.03 + Math.random() * 0.16,
    c: Math.random(),
    w: Math.random() ** 2,
  }));
  const total = clusters.reduce((t, c) => t + c.w, 0);
  for (let i = 0; i < MAX; i++) {
    const o = i * 4;
    if (Math.random() < 0.05) {
      data[o] = (Math.random() * 2 - 1) * WORLD_X;
      data[o + 1] = Math.random() * 2 - 1;
      data[o + 3] = Math.random();
    } else {
      let r = Math.random() * total;
      let k = 0;
      while (r > clusters[k].w && k < clusters.length - 1) r -= clusters[k++].w;
      const cl = clusters[k];
      data[o] = cl.x + gaussian() * cl.s * 1.4;
      data[o + 1] = cl.y + gaussian() * cl.s;
      data[o + 3] = cl.c;
    }
    data[o + 2] = Math.random();
  }
  return data;
}

export function initGpuDemo() {
  const root = document.querySelector<HTMLElement>('[data-playground]');
  if (!root) return;

  const stage = root.querySelector<HTMLElement>('.pg-stage')!;
  const glCanvas = root.querySelector<HTMLCanvasElement>('.pg-gl')!;
  const cpuCanvas = root.querySelector<HTMLCanvasElement>('.pg-2d')!;
  const fpsEl = root.querySelector<HTMLElement>('[data-hud-fps]')!;
  const countEl = root.querySelector<HTMLElement>('[data-hud-count]')!;
  const modeEl = root.querySelector<HTMLElement>('[data-hud-mode]')!;
  const input = root.querySelector<HTMLInputElement>('[data-count-input]')!;
  const cpuNote = root.querySelector<HTMLElement>('[data-cpu-note]')!;
  const modeBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-mode]'));
  const steps: number[] = JSON.parse(root.dataset.steps!);

  const coarse = matchMedia('(pointer: coarse)').matches;
  const CPU_CAP = coarse ? 25_000 : 100_000;
  cpuNote.textContent = `CPU mode is capped at ${CPU_CAP.toLocaleString('en-US')} markers so your device stays responsive. That's the whole point.`;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const motion = document.documentElement.classList.contains('motion');

  let gl: WebGLRenderingContext | null = null;
  let prog: WebGLProgram | null = null;
  let data: Float32Array | null = null;
  let loc: {
    scale: WebGLUniformLocation;
    offset: WebGLUniformLocation;
    time: WebGLUniformLocation;
    size: WebGLUniformLocation;
    alpha: WebGLUniformLocation;
  } | null = null;
  const ctx2d = cpuCanvas.getContext('2d');

  let mode: 'gpu' | 'cpu' = 'gpu';
  let count = steps[Number(input.value)];
  let w = 0;
  let h = 0;
  let zoom = 1;
  const offset = [0, 0];
  let running = false;
  let started = false;
  let raf = 0;
  let frames = 0;
  let fpsT = 0;
  const t0 = performance.now();

  const fmt = (n: number) => n.toLocaleString('en-US');
  const drawCount = () => (mode === 'cpu' ? Math.min(count, CPU_CAP) : count);

  function setup(): boolean {
    gl = glCanvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) return false;
    const sh = (type: number, src: string) => {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    };
    prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    data = generate();
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const aData = gl.getAttribLocation(prog, 'a_data');
    gl.enableVertexAttribArray(aData);
    gl.vertexAttribPointer(aData, 4, gl.FLOAT, false, 0, 0);

    loc = {
      scale: gl.getUniformLocation(prog, 'u_scale')!,
      offset: gl.getUniformLocation(prog, 'u_offset')!,
      time: gl.getUniformLocation(prog, 'u_time')!,
      size: gl.getUniformLocation(prog, 'u_size')!,
      alpha: gl.getUniformLocation(prog, 'u_alpha')!,
    };
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // additive glow, premultiplied in the shader
    gl.clearColor(0.027, 0.04, 0.055, 1);
    return true;
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    w = r.width;
    h = r.height;
    for (const c of [glCanvas, cpuCanvas]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    gl?.viewport(0, 0, glCanvas.width, glCanvas.height);
    ctx2d?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const scale = () => [zoom / (w / h), zoom];

  function pointSize() {
    const density = Math.log10(drawCount() / 10_000); // 0 .. 2
    return Math.max(1.4, 4.2 - density * 1.2) * dpr * Math.min(2.5, Math.sqrt(zoom));
  }

  function renderGpu(t: number) {
    if (!gl || !loc) return;
    const [sx, sy] = scale();
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(loc.scale, sx, sy);
    gl.uniform2f(loc.offset, offset[0], offset[1]);
    gl.uniform1f(loc.time, t);
    gl.uniform1f(loc.size, pointSize());
    // Additive blending saturates as markers pile up, so dim each one as the count grows (and brighten when zoomed in).
    const density = Math.log10(drawCount() / 10_000);
    gl.uniform1f(loc.alpha, Math.min(1, (0.85 - density * 0.33) * Math.sqrt(zoom)));
    gl.drawArrays(gl.POINTS, 0, drawCount());
  }

  function renderCpu(t: number) {
    if (!ctx2d || !data) return;
    const [sx, sy] = scale();
    ctx2d.fillStyle = '#070a0e';
    ctx2d.fillRect(0, 0, w, h);
    const n = drawCount();
    const base = pointSize() / dpr / 2;
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      const seed = data[o + 2];
      const ph = seed * 6.2831;
      const x = data[o] + Math.sin(t * 0.6 + ph) * 0.006;
      const y = data[o + 1] + Math.cos(t * 0.5 + ph * 1.3) * 0.006;
      const px = ((x + offset[0]) * sx * 0.5 + 0.5) * w;
      const py = (0.5 - (y + offset[1]) * sy * 0.5) * h;
      if (px < -4 || py < -4 || px > w + 4 || py > h + 4) continue;
      // Deliberately naive: a fresh path and fill for every single marker.
      ctx2d.beginPath();
      ctx2d.fillStyle = CPU_COLORS[Math.min(4, (data[o + 3] * 5) | 0)];
      ctx2d.arc(px, py, base, 0, Math.PI * 2);
      ctx2d.fill();
    }
  }

  function frame(now: number) {
    const t = (now - t0) / 1000;
    if (mode === 'gpu') renderGpu(motion ? t : 0);
    else renderCpu(motion ? t : 0);

    frames++;
    if (now - fpsT > 500) {
      fpsEl.textContent = String(Math.round((frames * 1000) / (now - fpsT)));
      frames = 0;
      fpsT = now;
    }
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    fpsT = performance.now();
    frames = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function updateHud() {
    countEl.textContent = fmt(drawCount());
    modeEl.textContent = mode === 'gpu' ? 'GPU · 1 draw call' : `CPU · ${fmt(drawCount())} draw calls`;
    modeEl.style.color = mode === 'gpu' ? '#5eead4' : '#f59e5b';
    cpuNote.hidden = !(mode === 'cpu' && count > CPU_CAP);
    input.setAttribute('aria-valuetext', `${fmt(count)} markers`);
  }

  function setMode(m: 'gpu' | 'cpu') {
    mode = m;
    modeBtns.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === m)));
    glCanvas.style.display = m === 'gpu' ? 'block' : 'none';
    cpuCanvas.style.display = m === 'cpu' ? 'block' : 'none';
    updateHud();
    if (!running) frame(performance.now());
  }

  function lazyStart() {
    if (started) return;
    started = true;
    if (!setup()) {
      root!.querySelector<HTMLElement>('.pg-fallback')!.hidden = false;
      modeBtns.forEach((b) => (b.disabled = true));
      input.disabled = true;
      return;
    }
    resize();
    updateHud();
  }

  // ---- Controls ----
  modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode as 'gpu' | 'cpu')));
  input.addEventListener('input', () => {
    count = steps[Number(input.value)];
    updateHud();
  });

  // ---- Pan & zoom ----
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDist = 0;

  const zoomAt = (factor: number, cx: number, cy: number) => {
    const [sx, sy] = scale();
    const clipX = (cx / w) * 2 - 1;
    const clipY = 1 - (cy / h) * 2;
    const wx = clipX / sx - offset[0];
    const wy = clipY / sy - offset[1];
    zoom = Math.min(40, Math.max(0.6, zoom * factor));
    const [nsx, nsy] = scale();
    offset[0] = clipX / nsx - wx;
    offset[1] = clipY / nsy - wy;
  };

  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });
  stage.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (pointers.size === 1) {
      const [sx, sy] = scale();
      offset[0] += ((cur.x - prev.x) * 2) / w / sx;
      offset[1] -= ((cur.y - prev.y) * 2) / h / sy;
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const r = stage.getBoundingClientRect();
      if (pinchDist > 0) zoomAt(d / pinchDist, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      pinchDist = d;
    }
    if (!running) frame(performance.now());
  });
  const release = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    pinchDist = 0;
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener(
    'wheel',
    (e) => {
      // Plain wheel scrolls the page; ctrl/⌘ + wheel (and trackpad pinch) zooms the map.
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX - r.left, e.clientY - r.top);
      if (!running) frame(performance.now());
    },
    { passive: false },
  );
  stage.addEventListener('dblclick', () => {
    zoom = 1;
    offset[0] = offset[1] = 0;
  });

  // ---- Lifecycle ----
  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => started && resize(), 150);
  });

  let inView = false;
  new IntersectionObserver(
    ([e]) => {
      inView = e.isIntersecting;
      if (inView) {
        lazyStart();
        if (gl) start();
      } else stop();
    },
    { rootMargin: '100px' },
  ).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (inView && gl) start();
  });
}
