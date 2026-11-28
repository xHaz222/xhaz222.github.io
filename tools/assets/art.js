// xHaz Tools — estilos generativos. Todos dibujan un bucle perfecto: draw(ctx, w, h, p, o) con p de 0 a 1.
// o = { bg, c: [c1, c2, c3], density 0..1, speed 1..3, seed }
const TAU = Math.PI * 2;

export const PALETTES = {
  noche:   ['#0b1026', '#4d7cff', '#8b5cf6', '#22d3ee'],
  aurora:  ['#06121f', '#34d399', '#22d3ee', '#a78bfa'],
  carmesi: ['#14070b', '#ef4444', '#f97316', '#fda4af'],
  oceano:  ['#04121c', '#0ea5e9', '#155e75', '#a5f3fc'],
  mono:    ['#0a0a0c', '#e5e7eb', '#9ca3af', '#4b5563'],
  arena:   ['#1c1410', '#f5d0a9', '#d97706', '#fde68a'],
  bosque:  ['#08130e', '#4ade80', '#166534', '#bbf7d0'],
  neon:    ['#0d0221', '#ff2a6d', '#05d9e8', '#d1f7ff'],
  lavanda: ['#15111f', '#c4b5fd', '#f0abfc', '#818cf8'],
  dorado:  ['#120e05', '#fbbf24', '#f59e0b', '#fef3c7'],
  rosa:    ['#1a0b14', '#f472b6', '#fb7185', '#fbcfe8'],
  hielo:   ['#0b1320', '#e0f2fe', '#7dd3fc', '#94a3b8'],
  vice:    ['#0d0f1a', '#ff5ca8', '#00f0ff', '#bc6cff'],
  luna:    ['#12081a', '#8a3d8f', '#6f7fd6', '#f3d6e4'],
  rubi:    ['#080808', '#c8102e', '#f5f2ed', '#5a0a14'],
  matrix:  ['#020a05', '#22ff88', '#0f7a3c', '#d6ffe6'],
  jade:    ['#07140f', '#7fd1a7', '#2e6b4f', '#e6f4ea'],
  brasa:   ['#0a0604', '#ff6a1a', '#ffb347', '#ffe2c4'],
  glitch:  ['#050507', '#ff2e63', '#08d9d6', '#eaeaea'],
  champan: ['#120c06', '#ffe897', '#c08a3e', '#fff6d6'],
};

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function hexRgb(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
export const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
function mixh(h1, h2, t) {
  const a = hexRgb(h1), b = hexRgb(h2);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function mixa(h1, h2, t, al = 1) {
  const a = hexRgb(h1), b = hexRgb(h2);
  return `rgba(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')},${al})`;
}
function mix(h1, h2, t) {
  const a = hexRgb(h1), b = hexRgb(h2);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
}

// Cache de partículas por semilla/tamaño
const CACHE = new Map();
function pts(key, n, make) {
  if (!CACHE.has(key)) { CACHE.set(key, make(n)); if (CACHE.size > 40) CACHE.delete(CACHE.keys().next().value); }
  return CACHE.get(key);
}
const scale = (w, h) => Math.sqrt(w * h) / 600; // tamaño relativo

function fillBg(ctx, w, h, o) {
  ctx.fillStyle = o.bg; ctx.fillRect(0, 0, w, h);
}

export const STYLES = {
  aurora: { es: 'Aurora', en: 'Aurora', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const a = TAU * p * o.speed, s = scale(w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, rgba(o.c[2], .18)); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    const bands = 2 + Math.round(o.density * 2);
    for (let b = 0; b < bands; b++) {
      const col = o.c[b % 3], base = h * (.28 + b * .12), amp = h * .08;
      const step = Math.max(2, Math.round(3 * s));
      for (let x = 0; x <= w; x += step) {
        const u = x / w;
        const y = base + amp * Math.sin(u * TAU * 1.3 + a + b * 1.7) + amp * .5 * Math.sin(u * TAU * 3 - a * 2 + b);
        const len = h * (.18 + .1 * Math.sin(u * TAU * 2 + a + b));
        const al = .10 + .08 * Math.sin(u * TAU * 5 + a * 3 + b * 2);
        const lg = ctx.createLinearGradient(0, y, 0, y + len);
        lg.addColorStop(0, rgba(col, 0)); lg.addColorStop(.25, rgba(col, al)); lg.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = lg; ctx.fillRect(x, y, step + .5, len);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    stars(ctx, w, h, p, o, 60, .5);
  } },

  olas: { es: 'Olas', en: 'Waves', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const a = TAU * p * o.speed, layers = 5 + Math.round(o.density * 5);
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1), base = h * (.35 + t * .6), amp = h * (.025 + t * .03);
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const u = x / w;
        const y = base + amp * Math.sin(u * TAU * (1.5 + i * .3) + a * (i % 2 ? 1 : -1) + i)
          + amp * .4 * Math.sin(u * TAU * 4 + a * 2 + i * 2);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h); ctx.closePath();
      ctx.fillStyle = mix(o.c[2], o.bg, .25 + t * .7);
      ctx.fill();
      ctx.strokeStyle = rgba(o.c[1], .25 * (1 - t) + .05); ctx.lineWidth = 1; ctx.stroke();
    }
  } },

  topografia: { es: 'Topografía', en: 'Topography', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const a = TAU * p * o.speed, cell = Math.max(6, Math.round(10 * scale(w, h)));
    const cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1, F = new Float32Array(cols * rows);
    const r = rng(o.seed); const ph = [r() * TAU, r() * TAU, r() * TAU, r() * TAU];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = i / cols * 4, y = j / rows * 3;
      F[j * cols + i] = Math.sin(x * 1.1 + ph[0] + Math.sin(a) * .6) + Math.sin(y * 1.3 + ph[1] + Math.cos(a) * .6)
        + .6 * Math.sin((x + y) * 1.7 + ph[2] + a) + .4 * Math.sin((x - y) * 2.3 + ph[3] - a);
    }
    const levels = 8 + Math.round(o.density * 10);
    ctx.lineWidth = Math.max(1, scale(w, h));
    for (let l = 0; l < levels; l++) {
      const v = -2.6 + 5.2 * (l + .5) / levels;
      ctx.strokeStyle = l % 4 === 0 ? rgba(o.c[1], .75) : rgba(o.c[2], .45);
      ctx.beginPath();
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
        const k = j * cols + i, A = F[k], B = F[k + 1], C = F[k + cols + 1], D = F[k + cols];
        const idx = (A > v) | ((B > v) << 1) | ((C > v) << 2) | ((D > v) << 3);
        if (idx === 0 || idx === 15) continue;
        const x0 = i * cell, y0 = j * cell, lerp = (p1, p2) => (v - p1) / (p2 - p1);
        const T = [x0 + cell * lerp(A, B), y0], R = [x0 + cell, y0 + cell * lerp(B, C)];
        const Bt = [x0 + cell * lerp(D, C), y0 + cell], Lf = [x0, y0 + cell * lerp(A, D)];
        const seg = { 1: [Lf, T], 2: [T, R], 3: [Lf, R], 4: [R, Bt], 5: [Lf, T, R, Bt], 6: [T, Bt], 7: [Lf, Bt],
          8: [Bt, Lf], 9: [T, Bt], 10: [T, R, Bt, Lf], 11: [R, Bt], 12: [R, Lf], 13: [T, R], 14: [Lf, T] }[idx];
        for (let s = 0; s < seg.length; s += 2) { ctx.moveTo(...seg[s]); ctx.lineTo(...seg[s + 1]); }
      }
      ctx.stroke();
    }
  } },

  niebla: { es: 'Bosque en niebla', en: 'Misty forest', draw(ctx, w, h, p, o) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, mix(o.bg, o.c[3] || o.c[2], .3)); g.addColorStop(1, o.bg);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const s = scale(w, h), layers = 4, fogCol = o.c[3] || '#ffffff';
    for (let l = 0; l < layers; l++) {
      const t = l / (layers - 1), base = h * (.5 + t * .36);
      const col = mix(o.c[2], o.bg, .25 + t * .65);
      ctx.fillStyle = col;
      // loma de fondo
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) ctx.lineTo(x, base + Math.sin(x / w * TAU * (1 + l * .4) + l * 2) * h * .025);
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      // pinos: tres pisos de triángulos, alturas variadas
      const rr = rng(o.seed + l * 101), gap = (34 - t * 10 - o.density * 12) * s + 6;
      for (let x = -gap * rr(); x < w + gap; x += gap * (.6 + rr() * .8)) {
        const th = (40 + rr() * 50) * s * (1 + t * .9), tw = th * (.32 + rr() * .08);
        const y = base + Math.sin(x / w * TAU * (1 + l * .4) + l * 2) * h * .025 + 2;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const top = y - th + k * th * .26, wd = tw * (.55 + k * .25);
          ctx.moveTo(x, top); ctx.lineTo(x + wd / 2, top + th * .42); ctx.lineTo(x - wd / 2, top + th * .42); ctx.closePath();
        }
        ctx.rect(x - tw * .05, y - th * .2, tw * .1, th * .2);
        ctx.fill();
      }
      // banda de niebla que cruza en bucle (dos copias para que no salte)
      const off = ((p * o.speed + l * .27) % 1) * w * 2;
      for (const dx of [0, -w * 2]) {
        const fx = off + dx - w * .5;
        const fg = ctx.createRadialGradient(fx, base - h * .03, 0, fx, base - h * .03, w * .7);
        fg.addColorStop(0, rgba(fogCol, .18 * (o.density + .5))); fg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fg; ctx.fillRect(0, 0, w, h);
      }
      const mist = ctx.createLinearGradient(0, base - h * .12, 0, base + h * .05);
      mist.addColorStop(0, 'rgba(0,0,0,0)'); mist.addColorStop(1, rgba(fogCol, .07));
      ctx.fillStyle = mist; ctx.fillRect(0, base - h * .12, w, h * .17);
    }
  } },

  espacio: { es: 'Espacio', en: 'Space', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const neb = ctx.createRadialGradient(w * .25, h * .3, 0, w * .25, h * .3, w * .6);
    neb.addColorStop(0, rgba(o.c[2], .22)); neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb; ctx.fillRect(0, 0, w, h);
    stars(ctx, w, h, p, o, 160 + o.density * 260, 1);
    // planeta con anillo, dibujado aquí (no es el logo de xat)
    const s = scale(w, h), R = 62 * s, cx = w * .8, cy = h * .72, a = TAU * p * o.speed;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.35 + .04 * Math.sin(a));
    ctx.strokeStyle = rgba(o.c[3] || o.c[1], .55); ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.ellipse(0, 0, R * 1.9, R * .45, 0, Math.PI, TAU); ctx.stroke();
    const pg = ctx.createLinearGradient(-R, -R, R, R);
    pg.addColorStop(0, o.c[1]); pg.addColorStop(1, mix(o.c[2], o.bg, .4));
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, R * 1.9, R * .45, 0, 0, Math.PI); ctx.stroke();
    ctx.restore();
  } },

  synthwave: { es: 'Synthwave', en: 'Synthwave', draw(ctx, w, h, p, o) {
    const hz = h * .58;
    const sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, o.bg); sky.addColorStop(1, mix(o.bg, o.c[1], .35));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hz);
    stars(ctx, w, hz * .8, p, o, 70, .7);
    const R = Math.min(w, h) * .2, cx = w / 2, cy = hz - R * .35;
    const sg = ctx.createLinearGradient(0, cy - R, 0, cy + R);
    sg.addColorStop(0, o.c[3] || '#fff'); sg.addColorStop(1, o.c[1]);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    ctx.fillStyle = sg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.fillStyle = mix(o.bg, o.c[1], .35);
    for (let i = 0; i < 6; i++) { const y = cy + R * (.1 + i * .16); ctx.fillRect(cx - R, y, R * 2, 2 + i * 1.6); }
    ctx.restore();
    ctx.fillStyle = mix(o.bg, '#000000', .3); ctx.fillRect(0, hz, w, h - hz);
    ctx.strokeStyle = rgba(o.c[2], .8); ctx.lineWidth = 1.2;
    const rows = 12, off = (p * o.speed) % 1;
    for (let i = 0; i < rows; i++) {
      const t = (i + off) / rows, y = hz + (h - hz) * t * t;
      ctx.globalAlpha = .25 + t * .75; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const cols = 10 + Math.round(o.density * 10);
    for (let i = -cols; i <= cols; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * (w / cols) * .12, hz); ctx.lineTo(cx + i * (w / cols) * 1.6, h); ctx.stroke();
    }
  } },

  malla: { es: 'Degradado vivo', en: 'Living gradient', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const a = TAU * p * o.speed, r = rng(o.seed), n = 4 + Math.round(o.density * 3);
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < n; i++) {
      const ox = r(), oy = r(), ph = r() * TAU, rad = Math.max(w, h) * (.35 + r() * .25);
      const x = w * (ox + .18 * Math.cos(a + ph)), y = h * (oy + .18 * Math.sin(a + ph));
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, rgba(o.c[i % 3], .55)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
  } },

  geometrico: { es: 'Geométrico', en: 'Geometric', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const a = TAU * p * o.speed, size = Math.round((80 - o.density * 45) * scale(w, h)) + 18;
    const hgt = size * Math.sqrt(3) / 2;
    for (let j = -1; j * hgt < h + hgt; j++) for (let i = -1; i * size < w + size; i++) {
      const x = i * size + (j % 2 ? size / 2 : 0), y = j * hgt;
      for (const up of [0, 1]) {
        const cx = x + (up ? size / 2 : 0), v = .5 + .5 * Math.sin(cx / w * TAU * 1.2 + y / h * TAU * .8 + a);
        ctx.fillStyle = v < .5 ? mix(o.bg, o.c[2], v * 1.2) : mix(o.c[2], o.c[1], (v - .5) * 1.6);
        ctx.beginPath();
        if (up) { ctx.moveTo(x + size / 2, y); ctx.lineTo(x + size, y + hgt); ctx.lineTo(x, y + hgt); }
        else { ctx.moveTo(x, y + hgt); ctx.lineTo(x + size, y + hgt); ctx.lineTo(x + size / 2, y + hgt * 2); }
        ctx.closePath(); ctx.globalAlpha = .55; ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = rgba(o.bg, .6); ctx.lineWidth = 1; ctx.stroke();
      }
    }
  } },

  bokeh: { es: 'Luces bokeh', en: 'Bokeh lights', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const n = Math.round(25 + o.density * 55), s = scale(w, h);
    const P = pts(`bokeh${o.seed}`, 120, n2 => { const r = rng(o.seed); return Array.from({ length: n2 }, () => [r(), r(), r(), r() * TAU, 1 + Math.floor(r() * 2)]); });
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const [x0, y0, z, ph, k] = P[i], R = (8 + z * 34) * s;
      const y = ((y0 - p * k * o.speed * .5) % 1 + 1) % 1 * (h + R * 2) - R;
      const x = x0 * w + Math.sin(TAU * p * k + ph) * 12 * s;
      const al = (.14 + .2 * z) * (.6 + .4 * Math.sin(TAU * p * k + ph));
      const g = ctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, rgba(o.c[i % 3], al)); g.addColorStop(.7, rgba(o.c[i % 3], al * .7)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  } },

  nieve: { es: 'Nieve', en: 'Snow', draw(ctx, w, h, p, o) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, o.bg); g.addColorStop(1, mix(o.bg, o.c[2], .3));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const n = Math.round(80 + o.density * 220), s = scale(w, h);
    const P = pts(`snow${o.seed}`, 300, n2 => { const r = rng(o.seed + 7); return Array.from({ length: n2 }, () => [r(), r(), r(), r() * TAU]); });
    for (let i = 0; i < n; i++) {
      const [x0, y0, z, ph] = P[i], k = 1 + Math.floor(z * 2);
      const y = ((y0 + p * k * o.speed) % 1) * (h + 10) - 5;
      const x = x0 * w + Math.sin(TAU * p * 2 + ph) * 10 * s * (1 + z);
      ctx.fillStyle = rgba(o.c[3] || '#ffffff', .35 + z * .6);
      ctx.beginPath(); ctx.arc(x, y, (.8 + z * 2.4) * s, 0, TAU); ctx.fill();
    }
  } },

  puntos: { es: 'Matriz de puntos', en: 'Dot matrix', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const a = TAU * p * o.speed, gap = Math.round((26 - o.density * 12) * scale(w, h)) + 6;
    const cx = w * .5, cy = h * .55;
    for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) {
      const d = Math.hypot(x - cx, y - cy) / Math.max(w, h);
      const v = .5 + .5 * Math.sin(d * TAU * 4 - a);
      ctx.fillStyle = v > .5 ? mix(o.c[2], o.c[1], (v - .5) * 2) : mix(o.bg, o.c[2], v * 2);
      ctx.beginPath(); ctx.arc(x, y, gap * (.1 + .3 * v), 0, TAU); ctx.fill();
    }
  } },

  teseracto: { es: 'Teseracto 4D', en: '4D tesseract', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    stars(ctx, w, h, p, o, 90, .6);
    // hipercubo: 16 vértices en 4D, giro en los planos XW y YZ (bucle exacto con p)
    const a = TAU * p * o.speed, b = TAU * p;
    const V = [];
    for (let i = 0; i < 16; i++) V.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
    const R = Math.min(w, h) * (.16 + o.density * .08), cx = w / 2, cy = h / 2;
    const P = V.map(([x, y, z, q]) => {
      let x1 = x * Math.cos(a) - q * Math.sin(a), w1 = x * Math.sin(a) + q * Math.cos(a);
      let y1 = y * Math.cos(b) - z * Math.sin(b), z1 = y * Math.sin(b) + z * Math.cos(b);
      const k4 = 2.4 / (3 - w1); x1 *= k4; y1 *= k4; z1 *= k4;          // 4D → 3D
      const k3 = 3.2 / (4.2 - z1);                                     // 3D → 2D
      return [cx + x1 * k3 * R, cy + y1 * k3 * R, w1];
    });
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) for (let d = 0; d < 4; d++) {
      const j = i ^ (1 << d); if (j < i) continue;
      const depth = (P[i][2] + P[j][2] + 2) / 4;
      ctx.strokeStyle = d === 3 ? rgba(o.c[2], .5 + depth * .5) : rgba(o.c[1], .45 + depth * .55);
      ctx.lineWidth = (1 + depth * 2.2) * scale(w, h);
      ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke();
    }
    for (const q of P) { ctx.fillStyle = o.c[3] || '#fff'; ctx.beginPath(); ctx.arc(q[0], q[1], 2.4 * scale(w, h), 0, TAU); ctx.fill(); }
  } },
  // ---------- inspirados en diseño web moderno ----------
  seda: { es: 'Seda', en: 'Silk', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const a = TAU * p * o.speed, s = scale(w, h);
    const glow = ctx.createRadialGradient(w * .62, h * .4, 0, w * .62, h * .4, Math.max(w, h) * .7);
    glow.addColorStop(0, rgba(o.c[0], .22)); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    const N = 50 + Math.round(o.density * 70), step = Math.max(3, w / 180);
    ctx.lineWidth = Math.max(1.2, 2 * s);
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const col = t < .5 ? mixa(o.c[0], o.c[1], t * 2, 1) : mixa(o.c[1], o.c[2], (t - .5) * 2, 1);
      ctx.strokeStyle = col.replace(/,1\)$/, `,${.1 + .2 * Math.pow(Math.sin(t * Math.PI), 2)})`);
      ctx.beginPath();
      for (let x = -step; x <= w + step; x += step) {
        const u = x / w;
        const fold = Math.sin(u * TAU * .9 + a + t * 2.2);
        const y = h * .5 + h * .2 * Math.sin(u * TAU * .7 + a + t * 1.1)
          + h * .07 * Math.sin(u * TAU * 1.6 - a * 2 + t * 4) + (t - .5) * h * .7 * fold;
        x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  } },

  glitch: { es: 'Glitch', en: 'Glitch', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const s = scale(w, h), steps = 24, k = Math.floor(p * steps) % steps, r = rng(o.seed * 31 + k * 7919);
    const burst = Math.pow(Math.max(0, Math.sin(TAU * p * o.speed)), 8);
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, rgba(o.c[0], .16)); bg.addColorStop(.55, 'rgba(0,0,0,0)'); bg.addColorStop(1, rgba(o.c[1], .14));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const n = 70 + Math.round(o.density * 170);
    const B = pts(`gl${o.seed}`, 340, m => { const q = rng(o.seed + 11); return Array.from({ length: m }, () => {
      const g = (q() + q() + q()) / 3; return [g, q(), .008 + q() * q() * .12, .003 + q() * q() * .016, q(), q()]; }); });
    const rows = 28, shift = Array.from({ length: rows }, () => (r() < .18 + burst * .5 ? (r() - .5) * w * (.06 + burst * .3) : 0));
    ctx.globalCompositeOperation = 'lighter';
    const off = (2 + burst * 10) * s;
    for (let i = 0; i < n; i++) {
      const [gx, gy, bw, bh, z, f] = B[i];
      if (f > .92 && r() < .5) continue;                   // parpadeo
      const row = Math.min(rows - 1, Math.floor(gy * rows));
      const x = (.2 + gx * .6) * w + shift[row], y = gy * h, W = bw * w, H = bh * h + s;
      ctx.fillStyle = rgba(o.c[0], .45 + z * .4); ctx.fillRect(x - off, y, W, H);
      ctx.fillStyle = rgba(o.c[1], .45 + z * .4); ctx.fillRect(x + off, y, W, H);
      ctx.fillStyle = rgba(o.c[2] || '#ffffff', .25 + z * .5); ctx.fillRect(x, y, W, H);
    }
    // franjas de corte
    const tears = 2 + Math.round(burst * 6);
    for (let i = 0; i < tears; i++) {
      const y = r() * h, th = (2 + r() * 14) * s;
      ctx.fillStyle = rgba(r() < .5 ? o.c[0] : o.c[1], .12 + burst * .25); ctx.fillRect(0, y, w, th);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    const ls = Math.max(2, Math.round(3 * s));
    for (let y = 0; y < h; y += ls) ctx.fillRect(0, y, w, ls / 2.5);
  } },

  agujero: { es: 'Agujero negro', en: 'Black hole', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    stars(ctx, w, h, p, o, 160 + o.density * 200, .8);
    const s = scale(w, h), cx = w / 2, cy = h / 2, R = Math.min(w, h) * .15;
    const halo = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 4.5);
    halo.addColorStop(0, rgba(o.c[0], .32)); halo.addColorStop(.4, rgba(o.c[1], .1)); halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
    const n = 700 + Math.round(o.density * 1100);
    const P = pts(`bh${o.seed}`, 1800, m => { const q = rng(o.seed + 5); return Array.from({ length: m }, () => {
      const rad = 1.18 + Math.pow(q(), 1.6) * 2.4; return [rad, q() * TAU, rad < 1.7 ? 3 : rad < 2.4 ? 2 : 1, q()]; }); });
    const disk = back => {
      for (let i = 0; i < n; i++) {
        const [rad, ang, k, z] = P[i], th = ang + TAU * p * k * o.speed, sy = Math.sin(th);
        if ((sy < 0) !== back) continue;
        const t = (rad - 1.18) / 2.4, x = cx + Math.cos(th) * rad * R, y = cy + sy * rad * R * .3;
        const side = .7 + .3 * Math.cos(th);                 // un lado más brillante
        ctx.fillStyle = t < .35 ? mixa('#ffffff', o.c[0], t / .35, (.5 + z * .5) * side) : mixa(o.c[0], o.c[1], (t - .35) / .65, (.35 + z * .5) * side);
        const d = (1 + z * 1.6) * s; ctx.fillRect(x, y, d * 1.8, d);
      }
    };
    ctx.globalCompositeOperation = 'lighter';
    disk(true);
    // disco detrás del agujero que la gravedad dobla hacia arriba
    const lens = ctx.createRadialGradient(cx, cy, R * 1.02, cx, cy, R * 1.75);
    lens.addColorStop(0, mixa('#ffffff', o.c[0], .2, .75)); lens.addColorStop(.25, rgba(o.c[0], .45)); lens.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lens; ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.75, R * 1.75, 0, Math.PI, TAU); ctx.lineTo(cx + R * 1.75, cy + R * .25); ctx.ellipse(cx, cy, R * 1.75, R * .55, 0, 0, Math.PI); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.shadowColor = o.c[0]; ctx.shadowBlur = 18 * s;
    ctx.strokeStyle = mixa('#ffffff', o.c[0], .3, .9); ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.03, 0, TAU); ctx.stroke(); ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    disk(false);
    ctx.globalCompositeOperation = 'source-over';
  } },

  hud: { es: 'HUD futurista', en: 'Futuristic HUD', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const s = scale(w, h), a = TAU * p * o.speed, cx = w / 2, cy = h / 2, R = Math.min(w, h) * .4;
    const gs = 32 * s;
    ctx.strokeStyle = rgba(o.c[0], .06); ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = (w / 2) % gs; x < w; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = (h / 2) % gs; y < h; y += gs) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.3);
    glow.addColorStop(0, rgba(o.c[0], .16)); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    if (ctx.createConicGradient) {
      const cg = ctx.createConicGradient(a, cx, cy);
      cg.addColorStop(0, rgba(o.c[0], .22)); cg.addColorStop(.12, rgba(o.c[0], 0)); cg.addColorStop(1, rgba(o.c[0], 0));
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, R * .95, 0, TAU); ctx.fill();
    }
    const rings = 4 + Math.round(o.density * 3);
    for (let i = 0; i < rings; i++) {
      const rr = R * (.28 + i * (.72 / rings)), rot = a * (i % 2 ? 1 : -1) * (1 + (i % 3 === 0)) + i;
      const col = i % 3 === 1 ? o.c[1] : o.c[0];
      ctx.strokeStyle = rgba(col, .55 + (i % 2) * .25); ctx.lineWidth = (i % 2 ? 1.2 : 2.4) * s;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      if (i % 3 === 0) { ctx.setLineDash([4 * s, 7 * s]); ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
      else if (i % 3 === 1) { for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, 0, rr, k * TAU / 3, k * TAU / 3 + TAU / 5); ctx.stroke(); } }
      else {
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU * .72); ctx.stroke();
        for (let k = 0; k < 48; k++) { const t = k / 48 * TAU, l = (k % 4 ? 3 : 7) * s; ctx.beginPath(); ctx.moveTo(Math.cos(t) * (rr + 3 * s), Math.sin(t) * (rr + 3 * s)); ctx.lineTo(Math.cos(t) * (rr + 3 * s + l), Math.sin(t) * (rr + 3 * s + l)); ctx.stroke(); }
      }
      ctx.restore();
    }
    // mira y líneas de datos
    ctx.strokeStyle = rgba(o.c[2] || o.c[0], .5); ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(cx - R * 1.4, cy); ctx.lineTo(cx - R * .2, cy); ctx.moveTo(cx + R * .2, cy); ctx.lineTo(cx + R * 1.4, cy);
    ctx.moveTo(cx, cy - R * 1.2); ctx.lineTo(cx, cy - R * .2); ctx.moveTo(cx, cy + R * .2); ctx.lineTo(cx, cy + R * 1.2);
    ctx.stroke();
    ctx.fillStyle = o.c[2] || '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 3 * s, 0, TAU); ctx.fill();
    const bars = 14, bw = 5 * s;
    for (const side of [-1, 1]) for (let i = 0; i < bars; i++) {
      const v = .25 + .75 * Math.abs(Math.sin(a * (1 + i % 3) + i * 1.7 + side));
      const x = side < 0 ? w * .07 + i * (bw + 3 * s) : w * .93 - (i + 1) * (bw + 3 * s), bh = v * h * .1;
      ctx.fillStyle = rgba(i % 4 ? o.c[0] : o.c[1], .55); ctx.fillRect(x, h * .88 - bh, bw, bh);
    }
    for (let i = 0; i < 6; i++) { const l = (.3 + .7 * Math.abs(Math.sin(i * 2.3 + a))) * w * .12; ctx.fillStyle = rgba(o.c[0], .35); ctx.fillRect(w * .07, h * .12 + i * 9 * s, l, 2.5 * s); }
    ctx.globalCompositeOperation = 'source-over';
  } },

  red: { es: 'Red de puntos', en: 'Network', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const s = scale(w, h), n = 45 + Math.round(o.density * 95), D = Math.min(w, h) * .2;
    const glow = ctx.createRadialGradient(w * .3, h * .7, 0, w * .3, h * .7, Math.max(w, h) * .6);
    glow.addColorStop(0, rgba(o.c[1], .16)); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    const P = pts(`net${o.seed}`, 140, m => { const q = rng(o.seed + 9); return Array.from({ length: m }, () => [q(), q(), .02 + q() * .05, q() * TAU, 1 + Math.floor(q() * 2), q()]); });
    const X = [];
    for (let i = 0; i < n; i++) { const [x, y, rr, ph, k] = P[i], t = TAU * p * k * o.speed + ph; X.push([(x + Math.cos(t) * rr) * w, (y + Math.sin(t) * rr * 1.3) * h]); }
    ctx.lineWidth = Math.max(.8, s);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = X[i][0] - X[j][0], dy = X[i][1] - X[j][1], d = Math.hypot(dx, dy);
      if (d < D) { ctx.strokeStyle = rgba((i + j) % 3 ? o.c[0] : o.c[1], (1 - d / D) * .45); ctx.beginPath(); ctx.moveTo(X[i][0], X[i][1]); ctx.lineTo(X[j][0], X[j][1]); ctx.stroke(); }
    }
    for (let i = 0; i < n; i++) {
      const z = P[i][5], R = (1.4 + z * 2.6) * s;
      const g = ctx.createRadialGradient(X[i][0], X[i][1], 0, X[i][0], X[i][1], R * 4);
      g.addColorStop(0, rgba(o.c[2] || '#fff', .9)); g.addColorStop(.25, rgba(o.c[0], .5)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X[i][0], X[i][1], R * 4, 0, TAU); ctx.fill();
    }
  } },

  tinta: { es: 'Tinta y sol rojo', en: 'Ink and red sun', draw(ctx, w, h, p, o) {
    const s = scale(w, h), hz = h * .7, a = TAU * p;
    const sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, o.bg); sky.addColorStop(1, mixa(o.bg, o.c[1], .22, 1));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hz);
    const sx = w * .64, sy = h * .27, SR = Math.min(w, h) * .15;
    const sg = ctx.createRadialGradient(sx, sy, SR * .9, sx, sy, SR * 2.6);
    sg.addColorStop(0, rgba(o.c[0], .3)); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = o.c[0]; ctx.beginPath(); ctx.arc(sx, sy, SR, 0, TAU); ctx.fill();
    const r = rng(o.seed + 21), ridges = 4;
    for (let L = 0; L < ridges; L++) {
      const t = L / (ridges - 1), base = hz - h * (.22 - t * .17), amp = h * (.14 - t * .05);
      const f1 = .8 + r() * 1.2, f2 = 2 + r() * 3, ph1 = r() * TAU, ph2 = r() * TAU;
      ctx.fillStyle = mixa(mixh(o.bg, o.c[1], .3 - t * .2), '#000000', t * .8, 1);
      ctx.beginPath(); ctx.moveTo(0, hz);
      for (let x = 0; x <= w; x += Math.max(3, w / 220)) {
        const u = x / w, y = base - amp * Math.abs(Math.sin(u * Math.PI * f1 + ph1)) - amp * .25 * Math.sin(u * TAU * f2 + ph2);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, hz); ctx.closePath(); ctx.fill();
      // niebla entre capas que se desliza
      const fy = base - amp * .1, fg = ctx.createLinearGradient(0, fy - amp * .5, 0, fy + amp * .4);
      fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(.6, rgba(o.c[1], .08 + .04 * Math.sin(a + L))); fg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fg; ctx.fillRect(0, fy - amp * .5, w, amp * .9);
    }
    // agua y reflejo
    ctx.fillStyle = mixa(o.bg, '#000000', .35, 1); ctx.fillRect(0, hz, w, h - hz);
    for (let i = 0; i < 18; i++) {
      const y = hz + (i + .5) * (h - hz) / 18, ww = SR * (2 - i * .07) * (.7 + .3 * Math.sin(a * 2 + i * 1.3));
      ctx.fillStyle = rgba(o.c[0], .7 - i * .032); ctx.fillRect(sx - ww / 2 + Math.sin(a + i) * 4 * s, y, ww, Math.max(1.5, 3.2 * s));
    }
    // torii pequeño en el agua (silueta genérica)
    const tx = sx, ty = hz + (h - hz) * .62, T = Math.min(w, h) * .2;
    const torii = (dir, al) => {
      ctx.fillStyle = `rgba(0,0,0,${al})`;
      ctx.fillRect(tx - T * .38, ty - (dir > 0 ? T : 0), T * .08, T);
      ctx.fillRect(tx + T * .3, ty - (dir > 0 ? T : 0), T * .08, T);
      const by = ty - dir * T * .72; ctx.fillRect(tx - T * .52, by - T * .04, T * 1.04, T * .07);
      const ky = ty - dir * T * .95; ctx.beginPath(); ctx.moveTo(tx - T * .66, ky - dir * T * .06); ctx.quadraticCurveTo(tx, ky + dir * T * .06, tx + T * .66, ky - dir * T * .06);
      ctx.lineTo(tx + T * .62, ky + dir * T * .05); ctx.quadraticCurveTo(tx, ky + dir * T * .14, tx - T * .62, ky + dir * T * .05); ctx.closePath(); ctx.fill();
    };
    torii(1, .95); torii(-1, .45);
    // pétalos que caen
    const F = pts(`ink${o.seed}`, 90, m => { const q = rng(o.seed + 4); return Array.from({ length: m }, () => [q(), q(), q(), q() * TAU, 1 + Math.floor(q() * 2)]); });
    const n = 20 + Math.round(o.density * 60);
    for (let i = 0; i < n; i++) {
      const [x0, y0, z, ph, k] = F[i];
      const x = (((x0 + p * k * .5) % 1) * 1.1 - .05) * w + Math.sin(a * k + ph) * 14 * s, y = ((y0 + p * k) % 1) * h;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a * k + ph); ctx.fillStyle = rgba(o.c[1], .5 + z * .45);
      ctx.beginPath(); ctx.ellipse(0, 0, (2.5 + z * 4) * s, (1.4 + z * 1.8) * s, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
  } },

  vidrio: { es: 'Vidrio líquido', en: 'Liquid glass', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const s = scale(w, h), a = TAU * p * o.speed, M = Math.max(w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const x = w * (.5 + .34 * Math.cos(a * (i % 2 ? 1 : -1) + i * 1.9)), y = h * (.5 + .3 * Math.sin(a * (i % 3 ? 1 : 2) + i * 2.6));
      const g = ctx.createRadialGradient(x, y, 0, x, y, M * .38);
      g.addColorStop(0, rgba(o.c[i % 3], .5)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
    const panes = [[.08, .14, .4, .34, 0], [.56, .1, .32, .5, 1.7], [.2, .6, .5, .24, 3.1]].slice(0, 2 + Math.round(o.density));
    for (const [px, py, pw, ph, f] of panes) {
      const x = px * w, y = py * h + Math.sin(a + f) * 8 * s, W = pw * w, H = ph * h, rr = Math.min(W, H) * .18;
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, W, H, rr); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x, y, W, H);
      const hl = ctx.createLinearGradient(x, y, x + W * .6, y + H);
      hl.addColorStop(0, 'rgba(255,255,255,.22)'); hl.addColorStop(.4, 'rgba(255,255,255,.03)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hl; ctx.fillRect(x, y, W, H);
      const sx = x - W * .4 + ((p * o.speed + f / TAU) % 1) * W * 1.8;
      const sp = ctx.createLinearGradient(sx - W * .12, 0, sx + W * .12, 0);
      sp.addColorStop(0, 'rgba(255,255,255,0)'); sp.addColorStop(.5, 'rgba(255,255,255,.16)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.transform(1, 0, -.35, 1, (y + H / 2) * .35, 0); ctx.fillStyle = sp; ctx.fillRect(sx - W * .12, y, W * .24, H);
      ctx.restore();
      const bd = ctx.createLinearGradient(x, y, x + W, y + H);
      bd.addColorStop(0, 'rgba(255,255,255,.7)'); bd.addColorStop(.5, 'rgba(255,255,255,.08)'); bd.addColorStop(1, 'rgba(255,255,255,.4)');
      ctx.strokeStyle = bd; ctx.lineWidth = 1.3 * s; ctx.beginPath(); ctx.roundRect(x + .5, y + .5, W - 1, H - 1, rr); ctx.stroke();
    }
  } },

  umbral: { es: 'Umbral digital', en: 'Digital threshold', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const u = Math.min(w, h);
    const x = w * .73, y = h * .48;
    const halo = ctx.createRadialGradient(x, y, u * .07, x, y, u * .56);
    halo.addColorStop(0, rgba(o.c[0], .62));
    halo.addColorStop(.5, rgba(o.c[1], .18));
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
    stars(ctx, w, h, p, o, 80, .44);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(u, u);
    ctx.beginPath();
    ctx.moveTo(-.31, .53);
    ctx.quadraticCurveTo(-.29, .32, -.13, .25);
    ctx.quadraticCurveTo(-.20, .14, -.17, -.03);
    ctx.quadraticCurveTo(-.14, -.27, .04, -.32);
    ctx.quadraticCurveTo(.19, -.28, .22, -.07);
    ctx.quadraticCurveTo(.24, .08, .13, .24);
    ctx.quadraticCurveTo(.29, .32, .34, .53);
    ctx.closePath();
    const coat = ctx.createLinearGradient(-.24, -.2, .26, .3);
    coat.addColorStop(0, o.bg);
    coat.addColorStop(.58, '#080910');
    coat.addColorStop(1, mixh('#080910', o.c[0], .24));
    ctx.fillStyle = coat;
    ctx.fill();
    ctx.strokeStyle = rgba(o.c[0], .68);
    ctx.lineWidth = .004;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-.085, .035);
    ctx.lineTo(.093, -.005);
    ctx.lineTo(.081, .021);
    ctx.lineTo(-.07, .063);
    ctx.closePath();
    ctx.fillStyle = rgba(o.c[0], .72 + .22 * Math.sin(TAU * p));
    ctx.shadowColor = o.c[0];
    ctx.shadowBlur = u * .04;
    ctx.fill();
    ctx.shadowBlur = 0;

    const random = rng(o.seed + 48);
    for (let i = 0; i < 55; i++) {
      const sx = .04 + random() * .31, sy = -.26 + random() * .72;
      const width = .008 + random() * .07;
      const alpha = .12 + .36 * (.5 + .5 * Math.sin(TAU * p + i));
      ctx.fillStyle = rgba(o.c[i % 2], alpha);
      ctx.fillRect(sx, sy, width, .003 + random() * .006);
    }
    ctx.restore();
  } },
  eclipse: { es: 'Eclipse', en: 'Eclipse', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    stars(ctx, w, h, p, o, 50 + o.density * 120, .45);
    const s = scale(w, h), a = TAU * p * o.speed, cx = w / 2, cy = h / 2, R = Math.min(w, h) * .19;
    const pulse = .8 + .2 * Math.sin(TAU * p);
    const line = ctx.createLinearGradient(0, 0, w, 0);
    line.addColorStop(0, 'rgba(0,0,0,0)'); line.addColorStop(.5, rgba(o.c[0], .55 * pulse)); line.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = line; ctx.fillRect(0, cy - .75 * s, w, 1.5 * s);
    const co = ctx.createRadialGradient(cx, cy, R * .96, cx, cy, R * 2.2);
    co.addColorStop(0, rgba(o.c[0], .65 * pulse)); co.addColorStop(.25, rgba(o.c[1], .22 * pulse)); co.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = co; ctx.beginPath(); ctx.arc(cx, cy, R * 2.2, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      const st = a + k * Math.PI;
      for (let j = 0; j < 6; j++) {
        ctx.strokeStyle = rgba(j < 2 ? '#ffffff' : o.c[2] || o.c[0], (.5 - j * .07)); ctx.lineWidth = (1.5 + j * 1.2) * s;
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.01, st, st + .5 + j * .05); ctx.stroke();
      }
    }
    ctx.restore();
    ctx.fillStyle = mixa(o.bg, '#000000', .6, 1); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(o.c[2] || '#ffffff', .35); ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  } },

  codigo: { es: 'Lluvia de código', en: 'Code rain', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const s = scale(w, h), fs = Math.max(10, 15 * s), cw = fs * .9, cols = Math.ceil(w / cw), rowsN = Math.ceil(h / fs);
    const CH = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ<>/{}=+*#xat';
    const C = pts(`code${o.seed}${cols}`, cols, m => { const q = rng(o.seed + 13); return Array.from({ length: m }, () => [q(), 1 + Math.floor(q() * 2), 8 + Math.floor(q() * 18), q()]); });
    const flick = Math.floor(p * 12) % 12;
    ctx.font = `${fs}px ui-monospace, "Cascadia Mono", Consolas, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let c = 0; c < cols; c++) {
      const [y0, k, len, z] = C[c];
      if (z > .35 + o.density * .65) continue;
      const span = rowsN + len, head = Math.floor(((y0 + p * k * o.speed) % 1) * span);
      for (let j = 0; j < len; j++) {
        const row = head - j; if (row < 0 || row >= rowsN) continue;
        const idx = (c * 131 + row * 17 + (j === 0 ? flick * 7 : (row + flick) % 5 === 0 ? flick : 0)) % CH.length;
        ctx.fillStyle = j === 0 ? (o.c[2] || '#ffffff') : rgba(o.c[0], (1 - j / len) * (.4 + z * .5));
        ctx.fillText(CH[idx], c * cw + cw / 2, row * fs);
      }
    }
    const vg = ctx.createLinearGradient(0, 0, 0, h); vg.addColorStop(0, rgba(o.bg, .6)); vg.addColorStop(.25, rgba(o.bg, 0)); vg.addColorStop(.8, rgba(o.bg, 0)); vg.addColorStop(1, rgba(o.bg, .7));
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  } },

  ecualizador: { es: 'Ecualizador', en: 'Equalizer', draw(ctx, w, h, p, o) {
    fillBg(ctx, w, h, o);
    const s = scale(w, h), a = TAU * p * o.speed, cy = h * .55;
    const glow = ctx.createRadialGradient(w / 2, cy, 0, w / 2, cy, Math.max(w, h) * .55);
    glow.addColorStop(0, rgba(o.c[0], .22)); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let L = 0; L < 5; L++) {
      ctx.strokeStyle = rgba(o.c[L % 3], .35); ctx.lineWidth = (1 + (L === 2) * 1.2) * s; ctx.beginPath();
      for (let x = 0; x <= w; x += Math.max(3, w / 200)) {
        const u = x / w, env = Math.sin(u * Math.PI);
        const y = cy + env * h * .16 * Math.sin(u * TAU * 2.2 + a * (L % 2 ? 1 : -1) + L * .8) * Math.cos(u * TAU * .6 - a + L);
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    const n = 40 + Math.round(o.density * 56), gap = w * .5 / n, bw = Math.max(2, gap * .55), x0 = w * .25;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), env = .25 + .75 * Math.sin(u * Math.PI);
      const v = env * (.15 + .85 * Math.abs(Math.sin(a + i * .45) * .6 + Math.sin(a * 2 + i * 1.3) * .3 + Math.sin(a * 3 - i * .7) * .1));
      const bh = v * h * .22, x = x0 + i * gap;
      const g = ctx.createLinearGradient(0, cy - bh, 0, cy);
      g.addColorStop(0, o.c[1]); g.addColorStop(1, o.c[0]);
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, cy - bh, bw, bh, bw / 2); ctx.fill();
      ctx.fillStyle = rgba(o.c[0], .22); ctx.beginPath(); ctx.roundRect(x, cy + 3 * s, bw, bh * .45, bw / 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  } },

};

function stars(ctx, w, h, p, o, n, strength) {
  const s = scale(w, h);
  const P = pts(`stars${o.seed}`, 600, n2 => { const r = rng(o.seed + 3); return Array.from({ length: n2 }, () => [r(), r(), r(), r() * TAU, 1 + Math.floor(r() * 3)]); });
  for (let i = 0; i < Math.min(n, 600); i++) {
    const [x, y, z, ph, k] = P[i];
    const al = strength * (.25 + .6 * z) * (.55 + .45 * Math.sin(TAU * p * k + ph));
    ctx.fillStyle = `rgba(255,255,255,${al})`;
    ctx.fillRect(x * w, y * h, (.6 + z * 1.4) * s, (.6 + z * 1.4) * s);
  }
}

// Acabados: grano y viñeta
let GRAIN;
export function finish(ctx, w, h, { grain = 0, vignette = 0 } = {}) {
  if (vignette > 0) {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.max(w, h) * .75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vignette})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  if (grain > 0) {
    if (!GRAIN) {
      GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 160;
      const gx = GRAIN.getContext('2d'), id = gx.createImageData(160, 160), r = rng(42);
      for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      gx.putImageData(id, 0, 0);
    }
    ctx.save(); ctx.globalAlpha = grain; ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
