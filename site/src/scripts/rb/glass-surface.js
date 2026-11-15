// Glass Surface from React Bits (reactbits.dev, MIT + Commons Clause), cut down to plain DOM: glassSurface(el)
// turns an existing element into glass. Chromium refracts the backdrop through an SVG displacement filter;
// Safari and Firefox cannot use SVG filters in backdrop-filter, so they get the frosted fallback instead.
let count = 0;

const supportsSVGFilters = id => {
  const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  if (isWebkit || isFirefox) return false;
  const div = document.createElement('div');
  div.style.backdropFilter = `url(#${id})`;
  return div.style.backdropFilter !== '';
};

export function glassSurface(
  el,
  {
    borderRadius = 20,
    borderWidth = 0.07,
    brightness = 50,
    opacity = 0.93,
    blur = 11,
    displace = 0,
    backgroundOpacity = 0,
    saturation = 1,
    distortionScale = -180,
    redOffset = 0,
    greenOffset = 10,
    blueOffset = 20,
    xChannel = 'R',
    yChannel = 'G',
    mixBlendMode = 'difference'
  } = {}
) {
  const id = `glass-${++count}`;
  const filterId = `${id}-filter`;
  const refractive = supportsSVGFilters(filterId);
  el.classList.add('glass-surface', refractive ? 'glass-surface--svg' : 'glass-surface--fallback');
  el.style.setProperty('--glass-frost', backgroundOpacity);
  el.style.setProperty('--glass-saturation', saturation);
  el.style.setProperty('--filter-id', `url(#${filterId})`);

  if (!refractive) {
    el.insertAdjacentHTML('afterbegin', '<span class="glass-surface__sheen" aria-hidden="true"></span><span class="glass-surface__rim" aria-hidden="true"></span>');
    return;
  }

  const channel = (name, offset, matrix) => `
    <feDisplacementMap in="SourceGraphic" in2="map" scale="${distortionScale + offset}" xChannelSelector="${xChannel}" yChannelSelector="${yChannel}" result="disp${name}" />
    <feColorMatrix in="disp${name}" type="matrix" values="${matrix}" result="${name}" />`;
  el.insertAdjacentHTML(
    'afterbegin',
    `<svg class="glass-surface__filter" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
      <filter id="${filterId}" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">
        <feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
        ${channel('red', redOffset, '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0')}
        ${channel('green', greenOffset, '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0')}
        ${channel('blue', blueOffset, '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0')}
        <feBlend in="red" in2="green" mode="screen" result="rg" />
        <feBlend in="rg" in2="blue" mode="screen" result="output" />
        <feGaussianBlur in="output" stdDeviation="${displace}" />
      </filter></defs></svg>`
  );
  const feImage = el.querySelector('feImage');

  // The displacement map: red and blue gradients push the backdrop sideways near the edges, and the blurred
  // grey middle leaves the centre undistorted. It is redrawn whenever the element changes size.
  const draw = () => {
    const w = el.offsetWidth || 400;
    const h = el.offsetHeight || 200;
    const edge = Math.min(w, h) * (borderWidth * 0.5);
    const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>
        <linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>
        <filter id="s" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${blur}" /></filter>
      </defs>
      <rect x="0" y="0" width="${w}" height="${h}" fill="black"></rect>
      <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#r)" />
      <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#b)" style="mix-blend-mode: ${mixBlendMode}" />
      <rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" filter="url(#s)" />
    </svg>`;
    feImage.setAttribute('href', `data:image/svg+xml,${encodeURIComponent(svg)}`);
  };
  draw();
  new ResizeObserver(draw).observe(el);
}
