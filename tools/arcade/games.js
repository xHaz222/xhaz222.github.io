import { shell, L } from '../assets/core.js';

shell('arcade');
const machine = document.getElementById('machine');
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const score = document.getElementById('score');
const guide = document.getElementById('guide');
const status = document.getElementById('status');
const controls = document.getElementById('controls');
const start = document.getElementById('start');
const W = canvas.width, H = canvas.height;
const field = ['#############','#..#.....#..#','#..#.###.#..#','#...........#','###.#.#.#.###','#...#...#...#','#.#...#...#.#','#...#...#...#','#############'];
const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const arrows = [['ArrowLeft','←'],['ArrowUp','↑'],['ArrowDown','↓'],['ArrowRight','→']];
const bumpers = [[135, 112], [239, 82], [340, 122], [235, 172]];
const content = {
  runner: { text: ['Salta los bloques. Espacio, ↑ o Saltar.', 'Jump over blocks with Space, ↑ or Jump.'], buttons: [['Space', L('Saltar','Jump')]] },
  maze: { text: ['Recoge todos los cristales. Usa las flechas o los controles de abajo.', 'Collect every crystal. Use the arrows or the controls below.'], buttons: arrows },
  pin: { text: ['Lanza con Espacio. Usa ← y → para activar las paletas cuando baje la bola.', 'Launch with Space. Use ← and → to flip as the ball approaches.'], buttons: [arrows[0], ['Space', L('Lanzar','Launch')], arrows[3]] },
};
let game = 'runner', state, running = false, raf = 0, previous = 0;

function reset() {
  running = false;
  cancelAnimationFrame(raf);
  const gems = new Set(field.flatMap((row, y) => [...row].flatMap((tile, x) => tile === '.' && (x !== 1 || y !== 1) ? [y * 13 + x] : [])));
  state = { points: 0, elapsed: 0, y: 0, vy: 0, obstacles: [{ x: 390, size: 29 }], next: 1.4, gx: 1, gy: 1, gems,
    balls: 3, ball: null, left: 0, right: 0 };
  status.textContent = '';
  guide.textContent = L(...content[game].text);
  controls.replaceChildren();
  for (const [key, label] of content[game].buttons) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn ghost';
    button.textContent = label;
    if (moves[key]) button.setAttribute('aria-label', L({ArrowLeft:'Izquierda',ArrowRight:'Derecha',ArrowUp:'Arriba',ArrowDown:'Abajo'}[key], key.replace('Arrow', '')));
    button.addEventListener('click', () => { if (!running) { reset(); begin(); } input(key); });
    controls.append(button);
  }
  start.textContent = L('Jugar', 'Play');
  draw();
}

function begin() {
  if (running) reset();
  running = true;
  previous = 0;
  status.textContent = '';
  start.textContent = L('Reiniciar', 'Restart');
  if (game !== 'maze') raf = requestAnimationFrame(loop);
}
function stop(message) {
  running = false;
  status.textContent = message;
  start.textContent = L('Volver a jugar', 'Play again');
}
function input(key) {
  if (game === 'runner' && (key === 'Space' || key === 'ArrowUp') && state.y <= 0) state.vy = 355;
  if (game === 'maze' && moves[key]) {
    const [dx, dy] = moves[key], x = state.gx + dx, y = state.gy + dy;
    if (field[y]?.[x] !== '.') return;
    state.gx = x; state.gy = y;
    if (state.gems.delete(y * 13 + x)) state.points++;
    if (!state.gems.size) stop(L('¡Laberinto completado!', 'Maze cleared!'));
    draw();
  }
  if (game === 'pin') {
    if (key === 'Space' && !state.ball) state.ball = { x: 239, y: 275, vx: 102, vy: -465 };
    if (key === 'ArrowLeft') state.left = .19;
    if (key === 'ArrowRight') state.right = .19;
  }
}
function keyHandler(event) {
  if (!running || !['Space', ...Object.keys(moves)].includes(event.code)) return;
  if (event.target instanceof HTMLButtonElement && event.code === 'Space') return;
  event.preventDefault();
  input(event.code);
}
machine.addEventListener('keydown', keyHandler);
start.addEventListener('click', () => { reset(); begin(); machine.focus(); });
for (const button of document.querySelectorAll('[data-game]')) {
  button.addEventListener('click', () => {
    game = button.dataset.game;
    for (const other of document.querySelectorAll('[data-game]')) other.setAttribute('aria-pressed', String(other === button));
    reset();
  });
}

function advanceRunner(dt) {
  state.y = Math.max(0, state.y + state.vy * dt);
  state.vy -= 830 * dt;
  if (!state.y && state.vy < 0) state.vy = 0;
  if (state.elapsed >= state.next) {
    const size = 22 + ((state.obstacles.length + Math.floor(state.elapsed * 7)) % 4) * 6;
    state.obstacles.push({ x: W + size, size });
    state.next = state.elapsed + 1.15 + (size % 5) * .10;
  }
  for (const block of state.obstacles) {
    block.x -= (180 + Math.min(100, state.elapsed * 3)) * dt;
    if (!block.passed && block.x + block.size < 86) { block.passed = true; state.points++; }
    if (block.x < 108 && block.x + block.size > 86 && state.y < block.size - 4) {
      stop(L('Fin de la partida.', 'Game over.'));
    }
  }
  state.obstacles = state.obstacles.filter(block => block.x + block.size > 0);
}

function advancePin(dt) {
  state.left = Math.max(0, state.left - dt);
  state.right = Math.max(0, state.right - dt);
  const b = state.ball;
  if (!b) return;
  b.vy += 385 * dt;
  b.x += b.vx * dt; b.y += b.vy * dt;
  if (b.x < 32 || b.x > W - 32) { b.x = Math.max(32, Math.min(W - 32, b.x)); b.vx *= -.9; }
  if (b.y < 25) { b.y = 25; b.vy = Math.abs(b.vy); }
  for (const [x, y] of bumpers) {
    const dx = b.x - x, dy = b.y - y, distance = Math.hypot(dx, dy);
    if (distance < 28 && distance > 0) {
      b.x = x + 29 * dx / distance;
      b.y = y + 29 * dy / distance;
      b.vx = 390 * dx / distance;
      b.vy = 390 * dy / distance;
      state.points += 10;
    }
  }
  if (b.y > 275 && b.y < 312 && b.vy > 0) {
    const left = b.x >= 65 && b.x <= 226 && state.left > 0;
    const right = b.x >= 254 && b.x <= 415 && state.right > 0;
    if (left || right) { b.vy = -480; b.vx = left ? 145 : -145; state.points += 5; }
  }
  if (b.y > H + 12) {
    state.ball = null;
    state.balls--;
    if (!state.balls) stop(L('Fin de la partida.', 'Game over.'));
  }
}

function loop(now) {
  const dt = previous ? Math.min(.025, (now - previous) / 1000) : 0;
  previous = now;
  state.elapsed += dt;
  if (game === 'runner') advanceRunner(dt);
  if (game === 'pin') advancePin(dt);
  draw();
  if (running) raf = requestAnimationFrame(loop);
}

function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function circle(x, y, radius, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); }
function line(x, y, x2, y2, width, color) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
}
function back() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#090f25'); g.addColorStop(1, '#1b2250');
  rect(0, 0, W, H, g);
  for (let i = 0; i < 58; i++) rect((i * 113 + 31) % W, (i * 59 + 41) % H, 1 + i % 2, 1, i % 3 ? '#6e82d267' : '#b6d9eebb');
}
function drawRunner() {
  circle(360, 90, 47, '#48467e');
  rect(0, 278, W, 52, '#111831');
  rect(0, 278, W, 3, '#60c8ff');
  for (let i = 0; i < 12; i++) rect(((i * 52 - state.elapsed * 80) % W + W) % W, 300, 20, 2, '#5266a1');
  for (const block of state.obstacles) {
    rect(block.x, 278 - block.size, block.size, block.size, '#a54be1');
    rect(block.x + 4, 282 - block.size, block.size - 8, 4, '#e7a4ff');
  }
  const y = 250 - state.y;
  rect(84, y, 26, 23, '#60f5de'); rect(89, y + 5, 19, 7, '#203f63');
  rect(89, y + 22, 7, 6, '#65b9ff'); rect(102, y + 22, 7, 6, '#65b9ff');
}
function drawMaze() {
  const s = 34, left = 19, top = 12;
  field.forEach((row, y) => [...row].forEach((cell, x) => {
    const px = left + x * s, py = top + y * s;
    if (cell === '#') { rect(px + 1, py + 1, s - 2, s - 2, '#243b76'); rect(px + 3, py + 3, s - 6, 2, '#567edf'); }
    if (state.gems.has(y * 13 + x)) circle(px + s / 2, py + s / 2, 3.5, '#f2b8ff');
  }));
  const x = left + (state.gx + .5) * s, y = top + (state.gy + .5) * s;
  rect(x - 10, y - 10, 20, 20, '#67edd8');
  rect(x - 6, y - 6, 12, 6, '#1a4160');
}
function drawPin() {
  line(24, 18, 24, H, 4, '#609bff'); line(W - 24, 18, W - 24, H, 4, '#609bff');
  line(24, 18, W - 24, 18, 4, '#609bff');
  for (const [i, [x, y]] of bumpers.entries()) {
    circle(x, y, 23, '#473984'); circle(x, y, 17, i % 2 ? '#f682dd' : '#62dcff');
    circle(x, y, 9, '#172944');
  }
  line(70, 295, 224, state.left > 0 ? 268 : 308, 9, '#9c8dff');
  line(410, 295, 256, state.right > 0 ? 268 : 308, 9, '#62dcff');
  if (state.ball) circle(state.ball.x, state.ball.y, 7, '#fff3ff');
  else if (state.balls) circle(239, 275, 7, '#fff3ff');
}
function draw() {
  back();
  if (game === 'runner') drawRunner();
  if (game === 'maze') drawMaze();
  if (game === 'pin') drawPin();
  const text = L('Puntos', 'Score') + ' ' + state.points + (game === 'pin' ? ' · ' + L('Bolas', 'Balls') + ' ' + state.balls : '');
  if (score.textContent !== text) score.textContent = text;
}
reset();
