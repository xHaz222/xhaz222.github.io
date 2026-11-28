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
