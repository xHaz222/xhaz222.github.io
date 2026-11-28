// xHaz Tools — núcleo compartido (idioma, navegación, copiar, descargas, GIF)
const Q = new URLSearchParams(location.search);
export const EN = Q.get('lang') ? Q.get('lang') === 'en' : !/^es\b/i.test(navigator.language || 'es');
export const L = (es, en) => (EN ? en : es);
document.documentElement.lang = EN ? 'en' : 'es';

const ROOT = new URL('../', import.meta.url).href; // .../tools/

export const TOOLS = [
  { g: ['Crear', 'Create'], items: [
    { id: 'fondos', es: 'Creador de fondos', en: 'Background maker', ready: true },
    { id: 'disenos', es: 'Fondos con título', en: 'Backgrounds with a title', ready: true },
    { id: 'texto', es: 'Texto animado 2D/3D', en: '2D/3D animated text', ready: true },
    { id: 'avatar', es: 'Avatar con forma y marco', en: 'Avatar with shape and frame', ready: true },
  ] },
  { g: ['Tu perfil', 'Your profile'], items: [
    { id: 'nombre', es: 'Nombre y status', en: 'Name and status', ready: true },
    { id: 'letras', es: 'Letras para nick', en: 'Letters for your nick', ready: true },
    { id: 'pawns', es: 'Pawns, hats y smileys', en: 'Pawns, hats and smileys', ready: true },
    { id: 'combos', es: 'Smileys combinados', en: 'Combined smileys', ready: true },
    { id: 'space', es: 'Generador de xatspace', en: 'xatspace generator', ready: true },
  ] },
  { g: ['xat en vivo', 'Live xat'], items: [
    { id: 'precios', es: 'Precios fairtrade', en: 'Fairtrade prices', ready: true },
    { id: 'trade', href: 'precios/?tab=trade', es: 'Trade justo', en: 'Fair trade', ready: true },
    { id: 'historial', es: 'Historial de precios', en: 'Price history' },
    { id: 'rareza', es: 'Índice de rareza', en: 'Rarity index' },
    { id: 'pawnworld', es: 'Pawn World', en: 'Pawn World' },
  ] },
  { g: ['Tu sala', 'Your room'], items: [
    { id: 'radio', es: 'Radio gratis', en: 'Free radio', ready: true },
    { id: 'repros', es: 'Repros para tu sala', en: 'Players for your room', ready: true },
    { id: 'count', es: 'Cuenta regresiva', en: 'Countdown' },
    { href: '../frames/', es: 'Colección de xatframes', en: 'xatframes collection', ready: true },
  ] },
];

const PLANET = `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><defs><linearGradient id="xhzPlanet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fa2ff"/><stop offset="1" stop-color="#3f4fd8"/></linearGradient></defs><circle cx="15" cy="15" r="8.5" fill="url(#xhzPlanet)"/><ellipse cx="15" cy="16" rx="14" ry="4.2" fill="none" stroke="#ffb48f" stroke-width="1.6" transform="rotate(-18 15 15)"/><path d="M6.6 13.2a8.5 8.5 0 0 1 16.8 0" fill="url(#xhzPlanet)"/></svg>`;

function withLang(href) {
  if (!Q.get('lang')) return href;
  return href + (href.includes('?') ? '&' : '?') + 'lang=' + Q.get('lang');
}

export function shell(current) {
  const top = document.querySelector('header.top');
  if (top) {
    const nav = TOOLS.map(sec => {
      const here = sec.items.some(t => t.id === current);
      const links = sec.items.map(t => {
        const href = t.href ? ROOT + t.href : ROOT + t.id + '/';
        const cur = t.id === current ? ' aria-current="page"' : '';
        return t.ready
          ? `<a href="${withLang(href)}"${cur}><span class="dot"></span>${L(t.es, t.en)}</a>`
          : `<a class="soon" aria-disabled="true" tabindex="-1"><span class="dot"></span>${L(t.es, t.en)}<small>${L('pronto', 'soon')}</small></a>`;
      }).join('');
      return `<details class="menu${here ? ' here' : ''}"><summary>${L(...sec.g)}</summary><div class="drop">${links}</div></details>`;
    }).join('');
    const path = location.pathname;
    top.innerHTML = `<div class="top-in"><a class="brand" href="${withLang(ROOT)}">${PLANET}<b>xHaz <span>Tools</span></b></a>
      <nav class="nav" aria-label="${L('Herramientas', 'Tools')}">${nav}</nav>
      <div class="lang"><a href="${path}?lang=es" class="${EN ? '' : 'on'}">ES</a><a href="${path}?lang=en" class="${EN ? 'on' : ''}">EN</a></div></div>`;
    // un menú abierto a la vez; cerrar al hacer clic fuera
    const menus = [...top.querySelectorAll('details.menu')];
    menus.forEach(m => m.addEventListener('toggle', () => { if (m.open) menus.forEach(o => o !== m && (o.open = false)); }));
    document.addEventListener('click', e => { if (!e.target.closest('details.menu')) menus.forEach(m => (m.open = false)); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') menus.forEach(m => (m.open = false)); });
  }
  const foot = document.querySelector('footer.foot');
  if (foot) foot.innerHTML = `<span>${L('Hecho por xHaz para la comunidad de xat. No es una página oficial de xat.', 'Made by xHaz for the xat community. Not an official xat page.')}</span><span>${L('Sin cookies ni registro. Todo se crea en tu navegador.', 'No cookies, no sign-up. Everything is made in your browser.')}</span>`;
  translate(document);
  if (!document.querySelector('.toast')) document.body.insertAdjacentHTML('beforeend', '<div class="toast" role="status" aria-live="polite"></div>');
}

// Textos estáticos: el HTML trae español; data-en tiene el inglés
export function translate(root) {
  if (!EN) return;
  root.querySelectorAll('[data-en]').forEach(el => { el.textContent = el.dataset.en; });
  root.querySelectorAll('[data-en-ph]').forEach(el => { el.placeholder = el.dataset.enPh; });
  root.querySelectorAll('[data-en-title]').forEach(el => { el.title = el.dataset.enTitle; });
}

let toastT;
export function toast(msg) {
  const t = document.querySelector('.toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 1600);
}

export async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  }
  toast(L('Copiado', 'Copied'));
}

export function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export const fmtBytes = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

// Exporta un GIF en bucle perfecto: render(ctx, fase 0..1, w, h)
export async function makeGIF({ w, h, frames, fps, render, onProgress, transparent = null }) {
  const { GIFEncoder, quantize, applyPalette } = await import('./gifenc.esm.js');
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const gif = GIFEncoder();
  const delay = Math.round(1000 / fps);
  for (let i = 0; i < frames; i++) {
    ctx.clearRect(0, 0, w, h);
    render(ctx, i / frames, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    let palette, index, opts = { delay, repeat: 0 };
    if (transparent) {
      palette = quantize(data, 256, { format: 'rgba4444', oneBitAlpha: true, clearAlpha: true, clearAlphaThreshold: 100 });
      index = applyPalette(data, palette, 'rgba4444');
      const ti = palette.findIndex(c => c[3] === 0);
      if (ti >= 0) { opts.transparent = true; opts.transparentIndex = ti; }
    } else {
      palette = quantize(data, 256);
      index = applyPalette(data, palette);
    }
    gif.writeFrame(index, w, h, { palette, ...opts });
    onProgress && onProgress((i + 1) / frames);
    if (i % 2 === 1) await new Promise(r => setTimeout(r, 0)); // no congelar la página
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}

export function canvasPNG(cv) {
  return new Promise(r => cv.toBlob(r, 'image/png'));
}

// Botones de copiar: <button data-copy="#id">
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  const src = document.querySelector(b.dataset.copy);
  if (src) copy(src.textContent);
});
