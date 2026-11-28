// MD5 compacto (dominio público, basado en el algoritmo RFC 1321). Se usa para ubicar la imagen de cada smiley.
export function md5(str) {
  const k = [], s = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  for (let i = 0; i < 64; i++) k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
  const bytes = new TextEncoder().encode(str), n = bytes.length;
  const words = new Array(((n + 8 >> 6) + 1) * 16).fill(0);
  for (let i = 0; i < n; i++) words[i >> 2] |= bytes[i] << (i % 4 * 8);
  words[n >> 2] |= 0x80 << (n % 4 * 8);
  words[words.length - 2] = n * 8;
  let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
  for (let off = 0; off < words.length; off += 16) {
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const t = d; d = c; c = b;
      const x = (a + f + k[i] + words[off + g]) | 0, r = s[(i >> 4) * 4 + i % 4];
      b = (b + ((x << r) | (x >>> (32 - r)))) | 0; a = t;
    }
    a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
  }
  return [a0, b0, c0, d0].map(v => [0, 8, 16, 24].map(sh => ((v >>> sh) & 255).toString(16).padStart(2, '0')).join('')).join('');
}
