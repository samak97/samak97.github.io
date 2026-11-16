// Wires the React Bits components (ported in ./rb/) into the page: glass nav, dock and buttons, the gooey nav
// highlight, the bell-toggle copy buttons, fade-in reveals, Magic Bento effects on the cards, click sparks,
// the bottom blur, and the lanyard badge in the footer (three.js, loaded only when the footer comes near).
import { glassSurface } from './rb/glass-surface.js';
import { mountGooeyNav } from './rb/gooey-nav.js';
import { magicBento, rgb } from './rb/magic-bento.js';
import { mountClickSpark } from './rb/click-spark.js';
import { gradualBlur } from './rb/gradual-blur.js';
import { fadeContent } from './rb/fade-content.js';
import { bellToggle } from './rb/bell-toggle.js';

// The same blue / red / yellow as the hero's gravity dots.
const COLORS = ['#7ea2ff', '#ff6b8b', '#ffc35c'];
const $ = s => document.querySelector(s);

// ---------- glass bars ----------
const nav = $('.nav');
const dock = $('#dock');
glassSurface(nav, { borderRadius: 26, backgroundOpacity: 0.35, saturation: 1.6, distortionScale: -120 });
glassSurface(dock, { borderRadius: 16, backgroundOpacity: 0.4, saturation: 1.6, distortionScale: -120 });
// A light blur under the refraction keeps the links readable over busy content.
nav.style.setProperty('--glass-blur', '8px');
dock.style.setProperty('--glass-blur', '8px');
// The plain (non-gradient) buttons are glass too: the copy-email toggles, the game link pills and the map zoom.
document.querySelectorAll('.copy-bell .bell-toggle__button, .more a, .zoom').forEach(button => {
  const radius = Math.min(parseFloat(getComputedStyle(button).borderTopLeftRadius) || 10, button.offsetHeight / 2);
  glassSurface(button, { borderRadius: radius, backgroundOpacity: 0.2, saturation: 1.5, distortionScale: -90 });
  button.style.setProperty('--glass-blur', '4px');
});

// ---------- copy email: a bell toggle that rings and says "Copied!" ----------
const email = $('#email');
document.querySelectorAll('.copy-bell').forEach(root => {
  const bell = bellToggle(root);
  const onFace = root.querySelector('.bell-toggle__face--on');
  let timer = 0;
  bell.button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email.textContent);
      onFace.textContent = 'Copied!';
    } catch {
      // No clipboard access (an old browser or an insecure page): select the address for a manual copy.
      const selection = getSelection();
      const range = document.createRange();
      range.selectNodeContents(email);
      selection.removeAllRanges();
      selection.addRange(range);
      onFace.textContent = 'Selected · ⌘C';
    }
    bell.button.setAttribute('aria-label', onFace.textContent);
    bell.set(true);
    clearTimeout(timer);
    timer = setTimeout(() => {
      bell.set(false);
      bell.button.setAttribute('aria-label', 'Copy email');
    }, 2200);
  });
});

// ---------- reveals: each block fades in, un-blurring, as it scrolls into view ----------
document.querySelectorAll('.rv').forEach(el => fadeContent(el, { blur: true, duration: 1, ease: 'power2.out', threshold: 0.1 }));

// ---------- gooey nav: follows the section in view ----------
// The pill is pale on the night glass and a warm near-black on the day glass.
const PILL = { dark: '#e8ecf4', light: '#2f2923' };
const theme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
const gooey = mountGooeyNav($('.nav .gooey-nav'), { theme: theme(), color: PILL[theme()], colors: COLORS, particleCount: 12 });
addEventListener('themechange', () => gooey.theme(theme(), PILL[theme()]));
// Sections without their own link light up the link they belong under; the hero and footer count too, so
// jumping straight to either end of the page still moves the pill.
const NAV_INDEX = { top: 0, about: 0, llumen: 0, experience: 1, education: 2, skills: 2, projects: 3, recommendation: 3, writing: 3, work: 3, play: 3, contact: 3 };
let current = 0;
let lockUntil = 0;
const show = index => {
  if (index === current) return;
  current = index;
  gooey.go(index);
};
// While a click scrolls the page, the sections it passes must not pull the pill back and forth.
document.querySelectorAll('.nav .gooey-nav__list:not([aria-hidden]) a').forEach((link, index) =>
  link.addEventListener('click', () => {
    lockUntil = performance.now() + 1400;
    show(index);
  })
);
addEventListener('scrollend', () => { lockUntil = 0; });
const spy = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting && performance.now() > lockUntil) show(NAV_INDEX[entry.target.id] ?? current);
  }),
  { rootMargin: '-45% 0px -50% 0px' }
);
document.querySelectorAll('#top, main section[id], #contact').forEach(section => spy.observe(section));

// ---------- Magic Bento on every card and widget ----------
const stars = COLORS.map(rgb);
magicBento([...document.querySelectorAll('.card, .facts > div')], { starColors: stars });
// The playground and the game are dragged, so they skip the press and the click ripple.
magicBento([...document.querySelectorAll('.win, .game')], { starColors: stars, clickEffect: false, particleCount: 36 });

// ---------- click sparks and the bottom blur ----------
mountClickSpark({ sparkColor: COLORS, sparkSize: 10, sparkRadius: 22, sparkCount: 8, duration: 450 });
gradualBlur({ height: '5rem', strength: 2, layers: 6, zIndex: 25 });

// ---------- lanyard badge ----------
const badge = $('#hang');
const near = new IntersectionObserver(
  entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    near.disconnect();
    import('./rb/lanyard.js').then(({ mountLanyard }) => {
      const stop = mountLanyard(badge, {
        frontImage: '/badge-front.jpg',
        backImage: '/badge-back.jpg',
        strapImage: '/badge-strap.jpg',
        cardColor: '#0d1017',
        strapColor: '#111318',
        size: 0.62,
        strapLength: 0.42,
        breeze: 0.35
      });
      if (stop) badge.classList.add('live');
    });
  },
  { rootMargin: '600px 0px' }
);
near.observe(badge);
