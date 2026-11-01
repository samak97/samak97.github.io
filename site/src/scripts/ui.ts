// Small UI behaviours that don't depend on animation libraries.

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

/* ---------- Toast ---------- */
let toastTimer = 0;
export function toast(msg: string) {
  const el = $('.toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 2200);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`Copied: ${text}`);
  } catch {
    toast('Copy failed — select and copy manually');
  }
}

/* ---------- Theme ---------- */
export function toggleTheme() {
  const d = document.documentElement;
  const next = d.dataset.theme === 'light' ? 'dark' : 'light';
  // Not persisted on purpose: every visit starts in dark mode.
  const apply = () => {
    d.dataset.theme = next;
  };
  // Circular reveal where supported, plain swap otherwise.
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition && d.classList.contains('motion')) doc.startViewTransition(apply);
  else apply();
}

function initTheme() {
  $$('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));
}

/* ---------- Mobile drawer ---------- */
function initDrawer() {
  const body = document.body;
  const scrim = $('.scrim');
  const openBtn = $('[data-drawer-open]');
  const set = (open: boolean) => {
    body.classList.toggle('drawer-open', open);
    if (scrim) scrim.hidden = !open;
    openBtn?.setAttribute('aria-expanded', String(open));
  };
  openBtn?.addEventListener('click', () => set(true));
  $$('[data-drawer-close]').forEach((b) => b.addEventListener('click', () => set(false)));
  $$('.sidebar a[href^="#"]').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(false);
  });
}

/* ---------- Scroll spy ---------- */
function initScrollSpy() {
  const links = new Map($$<HTMLAnchorElement>('[data-spy]').map((a) => [a.dataset.spy!, a]));
  const visible = new Map<string, number>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
      let best = '';
      let bestRatio = 0;
      for (const [id, r] of visible) if (r > bestRatio) [best, bestRatio] = [id, r];
      if (!best) return;
      links.forEach((a, id) => a.classList.toggle('active', id === best));
    },
    { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01, 0.25, 0.5, 1] },
  );
  links.forEach((_, id) => {
    const s = document.getElementById(id);
    if (s) io.observe(s);
  });
}

/* ---------- Tabs (Modules) ---------- */
function initTabs() {
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$<HTMLButtonElement>('[role="tab"]', root);
    const select = (tab: HTMLButtonElement, focus = false) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls')!);
        if (panel) panel.hidden = !on;
        if (on && panel) {
          panel.animate?.(
            [
              { opacity: 0, transform: 'translateY(12px)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: document.documentElement.classList.contains('motion') ? 450 : 0, easing: 'cubic-bezier(.22,1,.36,1)' },
          );
        }
      });
      if (focus) tab.focus();
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const k = e.key;
        if (k !== 'ArrowRight' && k !== 'ArrowLeft' && k !== 'Home' && k !== 'End') return;
        e.preventDefault();
        const n = tabs.length;
        const j = k === 'Home' ? 0 : k === 'End' ? n - 1 : (i + (k === 'ArrowRight' ? 1 : -1) + n) % n;
        select(tabs[j], true);
      });
    });
  });
}

/* ---------- Copy buttons ---------- */
function initCopy() {
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => copyText(b.dataset.copy!)));
}

/* ---------- Spotlight cards: cursor glow ---------- */
function initSpotlight() {
  $$('.spotlight').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ---------- Konami easter egg ---------- */
function initKonami() {
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let i = 0;
  document.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    i = k === code[i] ? i + 1 : k === code[0] ? 1 : 0;
    if (i === code.length) {
      i = 0;
      confetti();
      toast('Cheat code accepted: +30 lives 🎮');
    }
  });
}

function confetti() {
  if (!document.documentElement.classList.contains('motion')) return;
  const c = document.createElement('canvas');
  Object.assign(c.style, { position: 'fixed', inset: '0', zIndex: '95', pointerEvents: 'none', width: '100%', height: '100%' });
  document.body.appendChild(c);
  const ctx = c.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ['#5eead4', '#7c9cff', '#f59e5b', '#f472b6', '#a78bfa', '#facc15'];
  const parts = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2,
    y: innerHeight / 2,
    vx: (Math.random() - 0.5) * 16,
    vy: Math.random() * -16 - 4,
    s: Math.random() * 6 + 4,
    r: Math.random() * Math.PI,
    c: colors[(Math.random() * colors.length) | 0],
  }));
  const t0 = performance.now();
  const tick = (t: number) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.45;
      p.x += p.vx;
      p.y += p.vy;
      p.r += 0.1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    if (t - t0 < 3000) requestAnimationFrame(tick);
    else c.remove();
  };
  requestAnimationFrame(tick);
}

/* ---------- Scroll progress ---------- */
function initProgress() {
  const bar = $('.progress');
  if (!bar) return;
  let ticking = false;
  const update = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', String(h > 0 ? scrollY / h : 0));
    ticking = false;
  };
  addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

/* ---------- Touch wording (e.g. "cursor" -> "finger" in the hero terminal) ---------- */
function initTouchCopy() {
  if (!matchMedia('(pointer: coarse)').matches) return;
  $$('[data-touch]').forEach((el) => {
    el.dataset.text = el.dataset.touch!;
    const tx = $('.tx', el);
    if (tx) tx.textContent = el.dataset.touch!;
  });
}

export function initUI() {
  initTouchCopy();
  initTheme();
  initDrawer();
  initScrollSpy();
  initTabs();
  initCopy();
  initSpotlight();
  initKonami();
  initProgress();
}
