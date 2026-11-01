import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __motionReady?: boolean;
  }
}

const motion = () => document.documentElement.classList.contains('motion');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

let lenis: Lenis | null = null;

/** Smooth-scroll to a selector, respecting reduced motion and the fixed top bar. */
export function scrollToTarget(target: string) {
  const section = document.querySelector<HTMLElement>(target);
  if (!section) return;
  // Sections have generous top padding; land on the heading block instead so every
  // section sits the same small distance from the top (the hero has no padding, so it targets itself).
  const el = section.matches('.section')
    ? (section.querySelector<HTMLElement>('.section-head, .contact-card') ?? section)
    : section;
  const offset = innerWidth < 1100 ? -88 : -40;
  // Lenis also applies the page's CSS scroll-padding-top, so add it back to keep the same gap.
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  if (lenis) lenis.scrollTo(el, { offset: offset + pad, duration: 1.2 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: motion() ? 'smooth' : 'auto' });
  history.replaceState(null, '', target);
}

function initLenis() {
  if (!motion()) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initAnchors() {
  // A page opened as /#section gets the same heading alignment as an in-page click (after layout settles).
  addEventListener('load', () => {
    if (location.hash.length > 1 && location.hash !== '#readme') requestAnimationFrame(() => scrollToTarget(location.hash));
  });
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href')!;
    if (href.length < 2) return;
    e.preventDefault();
    scrollToTarget(href);
  });
}

/* ---------- Hero ---------- */
function heroIntro() {
  // These elements start hidden via CSS (html.js.motion), so every tween states both ends.
  const show = { opacity: 1, y: 0, x: 0, yPercent: 0, rotate: 0, scale: 1 };
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.fromTo('.hero .ch', { yPercent: 110, rotate: 8, opacity: 0 }, { ...show, duration: 1.1, stagger: 0.035 })
    .fromTo('.hero-crumb', { opacity: 0, y: 10 }, { ...show, duration: 0.6 }, 0.1)
    .fromTo(['.hero-role', '.hero-build', '.hero-tagline'], { opacity: 0, y: 20 }, { ...show, duration: 0.8, stagger: 0.1 }, 0.45)
    .fromTo('.hat', { opacity: 0, y: 12, scale: 0.9 }, { ...show, duration: 0.6, stagger: 0.08, ease: 'back.out(2)' }, 0.6)
    .fromTo('.hero-ctas > *', { opacity: 0, y: 20 }, { ...show, duration: 0.7, stagger: 0.08 }, 0.7)
    .fromTo('.hero-loc', { opacity: 0 }, { ...show, duration: 0.6 }, 0.9)
    .fromTo('.terminal', { opacity: 0, y: 40, scale: 0.96 }, { ...show, duration: 1 }, 0.5)
    // Stats are part of the first screen, so they arrive with the intro rather than on scroll.
    .fromTo('.hero .stat', { opacity: 0, y: 24 }, { ...show, duration: 0.8, stagger: 0.08 }, 0.9)
    .fromTo('.scroll-cue', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.3)
    .add(typeTerminal, 1.1);

  // Letters spring up on hover (desktop only).
  if (finePointer) {
    document.querySelectorAll<HTMLElement>('.hero .ch').forEach((ch) => {
      ch.addEventListener('mouseenter', () => {
        gsap.fromTo(ch, { y: 0 }, { y: -14, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1 });
      });
    });
  }
}

function typeTerminal() {
  const lines = Array.from(document.querySelectorAll<HTMLElement>('[data-terminal] .tl'));
  lines.forEach((l) => (l.style.visibility = 'hidden'));
  let i = 0;
  const next = () => {
    if (i >= lines.length) return;
    const line = lines[i++];
    const tx = line.querySelector<HTMLElement>('.tx')!;
    const full = line.dataset.text!;
    line.style.visibility = 'visible';
    if (!line.classList.contains('tl-cmd')) {
      gsap.from(line, { opacity: 0, x: -6, duration: 0.3 });
      gsap.delayedCall(0.18, next);
      return;
    }
    tx.textContent = '';
    let c = 0;
    const type = () => {
      tx.textContent = full.slice(0, ++c);
      if (c < full.length) gsap.delayedCall(0.028 + Math.random() * 0.04, type);
      else gsap.delayedCall(0.35, next);
    };
    gsap.delayedCall(0.25, type);
  };
  next();
}

function rotator() {
  const el = document.querySelector<HTMLElement>('.rotator');
  if (!el) return;
  const words: string[] = JSON.parse(el.dataset.words!);
  let w = 0;
  const cycle = () => {
    const current = words[w];
    w = (w + 1) % words.length;
    const nextWord = words[w];
    let n = current.length;
    const erase = () => {
      el.textContent = current.slice(0, --n);
      if (n > 0) gsap.delayedCall(0.03, erase);
      else {
        let m = 0;
        const type = () => {
          el.textContent = nextWord.slice(0, ++m);
          if (m < nextWord.length) gsap.delayedCall(0.055, type);
          else gsap.delayedCall(2.2, cycle);
        };
        gsap.delayedCall(0.2, type);
      }
    };
    erase();
  };
  gsap.delayedCall(2.6, cycle);
}

/* ---------- Scroll reveals ---------- */
function reveals() {
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, overwrite: true, clearProps: 'transform' }),
  });
}

function counters() {
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const obj = { v: 0 };
    el.textContent = '0';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          v: end,
          delay: 0.9, // lines up with the hero intro when the counters are visible on load
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => (el.textContent = String(Math.round(obj.v))),
        }),
    });
  });
}

function weightBars() {
  gsap.from('.w-bar', {
    scaleX: 0,
    duration: 1.2,
    ease: 'power3.out',
    stagger: 0.08,
    scrollTrigger: { trigger: '.weights', start: 'top 85%', once: true },
  });
}

function timelineRail() {
  const fill = document.querySelector('.rail-fill');
  if (!fill) return;
  gsap.fromTo(
    fill,
    { scaleY: 0 },
    { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 70%', scrub: 0.5 } },
  );
}

function parallax() {
  gsap.to('.hero .b1', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero .b2', { yPercent: -30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

/* ---------- Pointer niceties (mouse/trackpad only) ---------- */
function magnetic() {
  document.querySelectorAll<HTMLElement>('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.25);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

function tilt() {
  document.querySelectorAll<HTMLElement>('.tilt').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 10);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
    });
    el.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}

export function initMotion() {
  initAnchors();
  if (!motion()) {
    window.__motionReady = true;
    return;
  }
  initLenis();
  heroIntro();
  rotator();
  reveals();
  counters();
  weightBars();
  timelineRail();
  parallax();
  if (finePointer) {
    magnetic();
    tilt();
  }
  window.__motionReady = true;
  // Fonts and lazy content can shift layout; re-measure once everything has loaded,
  // then honour a #section link the page was opened with, using the same heading alignment.
  addEventListener('load', () => ScrollTrigger.refresh());
}
