// ECHO LOOP - record your run, rewind, and let your ghost help you.
const T = 48, DT = 1 / 60, SPEED = 4.6, R = 0.3, FPS = 60;
const $ = id => document.getElementById(id);
const cv = $('c'), g = cv.getContext('2d');

// Tiles: # wall, S start, E exit, P/D orange ring+door, Q/F cyan ring+door,
//        L lava, U spring, X blinking spikes, C coin
const LEVELS = [
  { n: 'Hold the Door', t: 6, loops: 2,
    goal: 'Reach the green EXIT. A purple door is in the way!',
    tips: ['Loop 1: walk onto the 🟠 ring, then press Rewind (Enter).',
           'Loop 2: a 👻 ghost repeats your moves and stands on the ring for you.',
           'The door opens. Walk through to the EXIT!'],
    hints: ['Loop 1: step on the orange ring, then press REWIND.',
            'Loop 2: your ghost holds the ring. Run through the open door to EXIT!'],
    help: 'Stand on the orange ring for a moment, then press REWIND. Do not rush loop 2, the ghost does the work.',
    map: ['############',
          '#S...#.....#',
          '#.P..D.....#',
          '#....#..C.E#',
          '############'] },
  { n: 'Lava Hop', t: 8, loops: 1,
    goal: 'Lava burns! Jump over it and reach the EXIT.',
    tips: ['Press SPACE (or the green JUMP button) to hop.',
           'You are safe while you are in the air 🦘',
           'Jump just before the lava edge.'],
    hints: ['Run to the lava and press JUMP right before the edge!'],
    help: 'Press JUMP when you are almost touching the lava. One jump crosses it.',
    map: ['############',
          '#S...LL...E#',
          '#....LL.CC.#',
          '#....LL....#',
          '############'] },
  { n: 'Super Spring', t: 8, loops: 1,
    goal: 'The lava is too wide for a normal jump. Use the spring!',
    tips: ['Step on the green ⬆ spring to launch far.',
           'Keep holding RIGHT while you fly.',
           'Land past the lava and reach the EXIT.'],
    hints: ['Walk right onto the green spring and keep holding RIGHT!'],
    help: 'Stay in the top row, walk onto the spring and hold RIGHT the whole time.',
    map: ['############',
          '#S.U.LLL..E#',
          '#....LLL.C.#',
          '#....LLL...#',
          '############'] },
  { n: 'Blink Spikes', t: 8, loops: 1,
    goal: 'Spikes pop up and down. Cross when they are down!',
    tips: ['Spikes flash just before they pop up ⚠️',
           'Wait for them to drop, then run across.',
           'You can also jump over them.'],
    hints: ['Watch the spikes. When they sink down, run across!'],
    help: 'The spikes go up and down every 2/3 of a second. Wait next to them, then run when they sink.',
    map: ['############',
          '#S..X......#',
          '#C..X.....E#',
          '#...X......#',
          '############'] },
  { n: 'Echo Jump', t: 7, loops: 2,
    goal: 'The ring is across the lava. Combine jumping and ghosts!',
    tips: ['Loop 1: jump the lava, stand on the 🟠 ring, press Rewind.',
           'Loop 2: your ghost jumps and holds the ring for you.',
           'Jump the lava again and run through the open door!'],
    hints: ['Loop 1: jump the lava, stand on the ring, press REWIND.',
            'Loop 2: jump the lava again. Your ghost holds the door open!'],
    help: 'Loop 1: jump the lava and stand on the ring. Rewind. Loop 2: repeat the jump, run through the door.',
    map: ['############',
          '#S..LL..#C.#',
          '#...LL.PD.E#',
          '#...LL..#..#',
          '############'] },
  { n: 'Danger Zone', t: 10, loops: 1,
    goal: 'Lava, spikes, lava. Stay calm and time it!',
    tips: ['Jump the first lava.',
           'Wait for the spikes to sink, then cross.',
           'Jump the second lava and reach the EXIT.'],
    hints: ['Jump, wait for the spikes, jump again. You can do it!'],
    help: 'Land after the first lava, wait until the spikes drop, cross, then jump the last lava.',
    map: ['###############',
          '#S.LL..X..LL.E#',
          '#..LL..X..LL..#',
          '#..LL.CXC.LL..#',
          '###############'] },
  { n: 'Two Keys', t: 9, loops: 3,
    goal: 'Two doors, two rings. You will need two ghosts!',
    tips: ['Loop 1: stand on the 🟠 ring and rewind.',
           'Loop 2: go through the purple door, stand on the 🔵 ring and rewind.',
           'Loop 3: both ghosts hold the doors. Run to the EXIT!'],
    hints: ['Loop 1: stand on the orange ring, then REWIND.',
            'Loop 2: pass the purple door, stand on the cyan ring, REWIND.',
            'Loop 3: both ghosts help you. Run to EXIT!'],
    help: 'Orange ring first. Next loop the cyan ring (past the purple door). Third loop: just run!',
    map: ['#############',
          '#S..#...#..C#',
          '#.P.D.Q.F..E#',
          '#...#...#...#',
          '#############'] },
  { n: 'Spring Chain', t: 10, loops: 1,
    goal: 'Two big gaps. Bounce over both!',
    tips: ['Use the first spring, land in the safe spot.',
           'Walk onto the second spring.',
           'Hold RIGHT the whole time!'],
    hints: ['Spring, land, spring again. Keep holding RIGHT!'],
    help: 'After the first landing, just keep walking right: the second spring is only one step away.',
    map: ['#################',
          '#S.U.LLL.U.LLL.E#',
          '#....LLL...LLL..#',
          '#....LLL..CLLL..#',
          '#################'] },
  { n: 'Echo Express', t: 8, loops: 2,
    goal: 'The final test! Lava, a ghost, a door and spikes.',
    tips: ['Loop 1: jump the lava, stand on the ring, rewind.',
           'Loop 2: jump the lava, go through the door.',
           'Cross the spikes when they sink, then reach EXIT!'],
    hints: ['Loop 1: jump the lava, stand on the ring, REWIND.',
            'Loop 2: jump, pass the door, wait for the spikes, EXIT!'],
    help: 'It is the same as Echo Jump, but there are spikes behind the door. Wait until they sink.',
    map: ['###############',
          '#S..LL..#.X..C#',
          '#...LL.PD.X..E#',
          '#...LL..#.X...#',
          '###############'] }
];
const GHOST_COLORS = ['#f472b6', '#a3e635', '#fbbf24'];

let SAVE = { stars: [], chill: true };
try { Object.assign(SAVE, JSON.parse(localStorage.getItem('echoloop') || '{}')); } catch (e) {}
const persist = () => { try { localStorage.setItem('echoloop', JSON.stringify(SAVE)); } catch (e) {} };
const unlocked = i => i === 0 || (SAVE.stars[i - 1] || 0) > 0;

let li = 0, S = 'card', loop = 0, t = 0, p, rec, ghosts = [], open = false, open2 = false;
let M, W, H, sx, sy, shake = 0, parts = [], jumpBuf = 0, acc = 0, last = 0, cardAct = null, card2Act = null;
let hasSpikes = false, pOpen = false, pOpen2 = false;
let coins = new Set(), total = 0, fails = 0, flashA = 0, menuPrev = 'card';
const k = { left: 0, right: 0, up: 0, down: 0 };
const lvTime = () => LEVELS[li].t * (SAVE.chill ? 1.5 : 1);
const spikeOn = n => Math.floor(n / 40) % 2 === 1;

// ---------- sound (Web Audio synth, no files needed) ----------
if (SAVE.music === undefined) SAVE.music = true;
let ac, master, dly, noiseBuf, nextNote = 0, noteI = 0;
function audio() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = SAVE.mute ? 0 : 0.9;
    const comp = ac.createDynamicsCompressor();
    master.connect(comp); comp.connect(ac.destination);
    dly = ac.createDelay(); dly.delayTime.value = 0.17;
    const fb = ac.createGain(), wet = ac.createGain(); fb.gain.value = 0.28; wet.gain.value = 0.22;
    dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(f, d = 0.1, o = {}) {
  try {
    const c = audio(), t0 = c.currentTime + (o.at || 0);
    const osc = c.createOscillator(), v = c.createGain();
    osc.type = o.type || 'square'; osc.frequency.setValueAtTime(f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + d);
    v.gain.setValueAtTime(0.0001, t0);
    v.gain.exponentialRampToValueAtTime(o.vol || 0.12, t0 + 0.008);
    v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    osc.connect(v); v.connect(master); if (o.echo) v.connect(dly);
    osc.start(t0); osc.stop(t0 + d + 0.02);
  } catch (e) {}
}
function noise(d = 0.2, o = {}) {
  try {
    const c = audio(), t0 = c.currentTime + (o.at || 0);
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = o.ft || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1000, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + d);
    const v = c.createGain();
    v.gain.setValueAtTime(o.vol || 0.2, t0); v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    s.connect(f); f.connect(v); v.connect(master); s.start(t0); s.stop(t0 + d + 0.02);
  } catch (e) {}
}
const sfx = {
  jump() { tone(280, 0.16, { to: 760, vol: 0.07 }); },
  land() { noise(0.08, { ft: 'lowpass', f: 500, vol: 0.25 }); tone(140, 0.09, { type: 'sine', to: 60, vol: 0.2 }); },
  step() { tone(90 + Math.random() * 30, 0.04, { type: 'triangle', vol: 0.05 }); },
  spring() { tone(180, 0.4, { type: 'triangle', to: 1100, vol: 0.16, echo: 1 }); tone(360, 0.3, { type: 'sine', to: 1500, vol: 0.08, at: 0.05 }); },
  coin(n) { const m = Math.pow(2, Math.min(n, 12) / 12); tone(988 * m, 0.07, { vol: 0.09 }); tone(1319 * m, 0.28, { vol: 0.09, at: 0.07, echo: 1 }); },
  plate(on) { tone(on ? 520 : 360, 0.12, { type: 'triangle', vol: 0.14, to: on ? 780 : 240 }); if (on) tone(110, 0.35, { type: 'sawtooth', to: 220, vol: 0.07, at: 0.04 }); },
  tick() { tone(1100, 0.03, { vol: 0.05 }); },
  dieLava() { noise(0.55, { f: 2500, to: 150, vol: 0.4 }); tone(420, 0.5, { type: 'sawtooth', to: 70, vol: 0.15 }); },
  dieSpike() { noise(0.12, { ft: 'highpass', f: 3000, vol: 0.3 }); tone(700, 0.25, { to: 90, vol: 0.14 }); },
  rewind() { noise(0.45, { f: 200, to: 3500, vol: 0.3 }); for (let i = 0; i < 5; i++) tone(300 + i * 150, 0.09, { type: 'sine', vol: 0.09, at: i * 0.06 }); },
  fail() { [392, 330, 262].forEach((f, i) => tone(f, 0.2, { type: 'triangle', vol: 0.12, at: i * 0.14 })); },
  start() { [523, 659, 784].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.1, at: i * 0.07, echo: 1 })); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, 0.35, { type: 'triangle', vol: 0.12, at: i * 0.1, echo: 1 }); tone(f / 2, 0.35, { vol: 0.04, at: i * 0.1 }); }); },
  click() { tone(820, 0.05, { type: 'triangle', vol: 0.07 }); }
};
// gentle looping background music (A minor), scheduled slightly ahead for steady timing
const BASS = [55, 0, 55, 0, 65.41, 0, 65.41, 0, 49, 0, 49, 0, 43.65, 0, 43.65, 0];
const ARP = [220, 261.6, 329.6, 261.6, 261.6, 329.6, 392, 329.6, 196, 246.9, 293.7, 246.9, 174.6, 220, 261.6, 220];
function musicTick() {
  if (!ac) return;
  if (!SAVE.music || SAVE.mute || ac.state !== 'running') { nextNote = ac.currentTime; return; }
  nextNote = Math.max(nextNote, ac.currentTime);
  while (nextNote < ac.currentTime + 0.2) {
    const i = noteI % 16, at = nextNote - ac.currentTime;
    if (BASS[i]) tone(BASS[i], 0.3, { type: 'triangle', vol: 0.1, at });
    tone(ARP[i], 0.12, { vol: 0.025, at, echo: 1 });
    nextNote += 0.17; noteI++;
  }
}
setInterval(musicTick, 60);
const wake = () => { try { audio(); } catch (e) {} };
addEventListener('pointerdown', wake); addEventListener('keydown', wake);
addEventListener('click', e => { const b = e.target && e.target.closest && e.target.closest('button'); if (b && b.id !== 'go' && b.id !== 'go2') sfx.click(); });
if (document.addEventListener) document.addEventListener('visibilitychange', () => { try { document.hidden ? ac.suspend() : ac.resume(); } catch (e) {} });
function soundLabels() {
  $('snd').textContent = SAVE.mute ? '🔇 Sound off' : '🔊 Sound on';
  $('mus').textContent = SAVE.music ? '🎵 Music on' : '🎵 Music off';
}
$('snd').onclick = () => { SAVE.mute = !SAVE.mute; if (master) master.gain.value = SAVE.mute ? 0 : 0.9; persist(); soundLabels(); };
$('mus').onclick = () => { SAVE.music = !SAVE.music; persist(); soundLabels(); };

// ---------- helpers ----------
function tile(x, y) { const r = M[Math.floor(y)]; return (r && r[Math.floor(x)]) || '#'; }
function hit(x, y) {
  for (const [a, b] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
    const c = tile(x + a, y + b);
    if (c === '#' || (c === 'D' && !open) || (c === 'F' && !open2)) return true;
  }
  return false;
}
function move(dx, dy) {
  if (!hit(p.x + dx, p.y) || hit(p.x, p.y)) p.x += dx;
  if (!hit(p.x, p.y + dy) || hit(p.x, p.y)) p.y += dy;
}
function burst(x, y, c, n, sp = 120) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, s = Math.random() * sp;
    parts.push({ x: x * T, y: y * T, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, l: 0.6, c });
  }
}
const puff = (e, n) => burst(e.x, e.y + 0.3, '#ffffff', n, 60);
let toastTimer;
function toast(msg) {
  const el = $('toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
const starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);

// ---------- levels ----------
function loadLevel(i, intro = true) {
  li = i; const lv = LEVELS[i];
  M = lv.map; H = M.length; W = M[0].length;
  cv.width = W * T; cv.height = H * T;
  total = 0; hasSpikes = M.some(r => r.includes('X'));
  M.forEach((row, y) => {
    const x = row.indexOf('S'); if (x >= 0) { sx = x; sy = y; }
    total += (row.match(/C/g) || []).length;
  });
  ghosts = []; loop = 0; coins = new Set(); fails = 0; resetLoop();
  if (intro) showIntro(); else S = 'play';
}
function showIntro() {
  const lv = LEVELS[li];
  card(`Level ${li + 1}: ${lv.n}`, lv.goal, lv.tips, '▶ Start', null);
}
function resetLoop() {
  p = { x: sx + 0.5, y: sy + 0.5, air: 0, max: 0.6, f: 1 };
  t = 0; rec = []; pOpen = pOpen2 = false; updateHUD();
}
function updateHUD() {
  const lv = LEVELS[li];
  $('lvl').textContent = `Level ${li + 1}/${LEVELS.length}: ${lv.n}`;
  $('hint').textContent = fails >= 2 ? '🆘 ' + lv.help : '💡 ' + lv.hints[Math.min(loop, lv.hints.length - 1)];
  let s = '';
  for (let i = 0; i < lv.loops; i++) s += i < loop ? '👻' : i === loop ? '🔴' : '⚪';
  $('loops').textContent = lv.loops > 1 ? s : '';
  $('coins').textContent = `🪙 ${coins.size}/${total}`;
  $('rewind').style.display = lv.loops > 1 ? '' : 'none';
  $('skip').style.display = fails >= 3 ? 'inline-block' : 'none';
}
function card(title, goal, tips, btn, act, btn2, act2) {
  $('ct').textContent = title; $('cg').textContent = goal;
  $('cl').innerHTML = tips.map(x => '<li>' + x + '</li>').join('');
  $('legend').style.display = tips.length ? '' : 'none';
  $('go').textContent = btn; cardAct = act;
  $('go2').style.display = btn2 ? 'block' : 'none';
  if (btn2) { $('go2').textContent = btn2; card2Act = act2; }
  $('card').classList.add('show'); S = 'card';
}
function closeCard(act) { sfx.start(); $('card').classList.remove('show'); S = 'play'; acc = 0; if (act) act(); }
$('go').onclick = () => closeCard(cardAct);
$('go2').onclick = () => closeCard(card2Act);

// ---------- menu ----------
function showMenu() {
  if (S === 'won') return;
  menuPrev = S; S = 'card';
  $('chill').checked = SAVE.chill;
  $('grid').innerHTML = LEVELS.map((lv, i) => {
    const st = Math.floor(SAVE.stars[i] || 0);
    return `<button data-i="${i}" ${unlocked(i) ? '' : 'disabled'} class="${st ? 'done' : ''}">${unlocked(i) ? i + 1 : '🔒'}<br><small>${unlocked(i) ? starText(st) : ''}</small></button>`;
  }).join('');
  $('grid').querySelectorAll('button').forEach(b => b.onclick = () => {
    $('menu').classList.remove('show'); $('card').classList.remove('show'); loadLevel(+b.dataset.i);
  });
  $('menu').classList.add('show');
}
$('close').onclick = () => { $('menu').classList.remove('show'); S = menuPrev; acc = 0; };
$('chill').onchange = e => { SAVE.chill = e.target.checked; persist(); if (S !== 'won') { ghosts = []; loop = 0; resetLoop(); } };
$('menuBtn').onclick = showMenu;

// ---------- game events ----------
function die(why, kind) {
  fails++; shake = 14; burst(p.x, p.y, '#ff6a00', 28); kind === 'spike' ? sfx.dieSpike() : sfx.dieLava();
  toast(why); resetLoop();
}
function endLoop() {
  if (S !== 'play' || t < 20 || LEVELS[li].loops < 2) return;
  ghosts.push(rec); loop++; flashA = 1;
  burst(p.x, p.y, GHOST_COLORS[(loop - 1) % 3], 24);
  sfx.rewind();
  if (loop >= LEVELS[li].loops) {
    fails++; sfx.fail(); toast('⏳ Out of loops! Same level, fresh start.'); ghosts = []; loop = 0;
  } else toast('⏪ Rewind! Your ghost is replaying.');
  resetLoop();
}
function nextLevel() { li + 1 < LEVELS.length ? loadLevel(li + 1) : (showMenu(), S = 'card'); }
function win() {
  S = 'won'; sfx.win();
  for (let i = 0; i < 70; i++)
    burst(W / 2, H / 2, ['#ff3d81', '#ffd23f', '#38e8ff', '#22c55e'][i % 4], 1, 400);
  const left = lvTime() - t / FPS;
  const st = 1 + (coins.size === total ? 1 : 0) + (left >= lvTime() * 0.3 ? 1 : 0);
  SAVE.stars[li] = Math.max(Math.floor(SAVE.stars[li] || 0), st); persist();
  const msg = `${starText(st)}  Coins ${coins.size}/${total}` +
    (coins.size < total ? ' (collect all for a star)' : '') + (st < 3 && left < lvTime() * 0.3 ? ' • Finish faster for the 3rd star' : '');
  const lastLv = li === LEVELS.length - 1;
  setTimeout(() => card(lastLv ? '🏆 You beat Echo Loop!' : '🎉 Level complete!', msg, [],
    lastLv ? '☰ All levels' : 'Next level ➜', lastLv ? showMenu : nextLevel,
    '↻ Replay for more stars', () => loadLevel(li, false)), 900);
}
function skip() { SAVE.stars[li] = SAVE.stars[li] || 0.5; persist(); toast('⏭ Skipped. You can replay it from ☰ Levels.'); nextLevel(); }

// ---------- one fixed step ----------
function step() {
  open = open2 = false;
  const ents = [p, ...ghosts.map(gh => gh[Math.min(t, gh.length - 1)])];
  for (const e of ents) if (e.air <= 0) { const c = tile(e.x, e.y); if (c === 'P') open = true; if (c === 'Q') open2 = true; }

  if ((open && !pOpen) || (open2 && !pOpen2)) sfx.plate(1);
  else if ((!open && pOpen) || (!open2 && pOpen2)) sfx.plate(0);
  pOpen = open; pOpen2 = open2;
  if (hasSpikes && !spikeOn(t) && (t % 40 === 28 || t % 40 === 32 || t % 40 === 36)) sfx.tick();
  const mx = k.right - k.left, my = k.down - k.up, n = mx && my ? 0.707 : 1;
  move(mx * n * SPEED * DT, my * n * SPEED * DT);
  if (mx) p.f = mx;
  if (p.air <= 0) {
    if (jumpBuf > 0) { p.air = p.max = 0.6; jumpBuf = 0; sfx.jump(); puff(p, 6); }
    else if (tile(p.x, p.y) === 'U') { p.air = p.max = 1.3; sfx.spring(); puff(p, 14); }
    else if ((mx || my) && t % 8 === 0) { puff(p, 1); if (t % 16 === 0) sfx.step(); }
  }
  if (jumpBuf > 0) jumpBuf--;
  if (p.air > 0) { p.air -= DT; if (p.air <= 0) { p.air = 0; puff(p, 5); sfx.land(); } }

  const c = tile(p.x, p.y), key = Math.floor(p.x) + ',' + Math.floor(p.y);
  if (c === 'C' && !coins.has(key)) {
    coins.add(key); sfx.coin(coins.size); burst(p.x, p.y, '#ffd23f', 12, 90); updateHUD();
  }
  if (p.air <= 0) {
    if (c === 'L') return die('🔥 Splash! Jump over the lava.', 'lava');
    if (c === 'X' && spikeOn(t)) return die('⚠️ Ouch! Wait until the spikes sink.', 'spike');
    if (c === 'E') return win();
  }
  rec.push({ x: p.x, y: p.y, air: p.air, max: p.max, f: p.f });
  t++;
  if (t >= lvTime() * FPS) endLoop2();
}
function endLoop2() { if (LEVELS[li].loops < 2) { fails++; sfx.fail(); toast('⏳ Time is up. Try again, you are faster now!'); resetLoop(); } else endLoop(); }

// ---------- drawing ----------
function body(e, col, a, now) {
  const h = e.air > 0 ? Math.sin(Math.PI * e.air / e.max) * (e.max > 1 ? 46 : 26) : 0;
  const x = e.x * T, y = e.y * T;
  g.globalAlpha = a * 0.4; g.fillStyle = '#000';
  g.beginPath(); g.ellipse(x, y + 14, 14 - h / 6, 6 - h / 12, 0, 0, 7); g.fill();
  g.globalAlpha = a; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 14;
  g.beginPath(); g.ellipse(x, y - h, 15 - (h > 0 ? 2 : 0), 15 + (h > 0 ? 3 : Math.sin(now * 8)), 0, 0, 7); g.fill();
  g.shadowBlur = 0;
  for (const s of [-5, 5]) {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + e.f * 3 + s, y - h - 3, 4.5, 0, 7); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.arc(x + e.f * 5 + s, y - h - 3, 2, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
}
function ring(px, py, col, on, now) {
  g.strokeStyle = col; g.lineWidth = 5; g.shadowColor = col; g.shadowBlur = on ? 20 : 8;
  g.beginPath(); g.arc(px + T / 2, py + T / 2, 14 + Math.sin(now * 4) * 2, 0, 7); g.stroke();
  if (on) { g.fillStyle = col + '88'; g.fill(); }
  g.shadowBlur = 0;
}
function door(px, py, on, c1, c2) {
  if (!on) {
    g.fillStyle = c1; g.fillRect(px + 8, py, T - 16, T);
    g.fillStyle = c2; for (let i = 0; i < 4; i++) g.fillRect(px + 8, py + i * 12 + 4, T - 16, 4);
  } else { g.strokeStyle = c1 + '99'; g.setLineDash([4, 4]); g.strokeRect(px + 8, py + 2, T - 16, T - 4); g.setLineDash([]); }
}
function draw() {
  const now = performance.now() / 1000;
  g.save();
  if (shake > 0.5) { g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.85; }
  g.fillStyle = '#0b1026'; g.fillRect(0, 0, cv.width, cv.height);
  const on = spikeOn(t), warn = !on && t % 40 >= 28 && Math.floor(now * 12) % 2 === 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = M[y][x], px = x * T, py = y * T;
    if (c === '#') {
      g.fillStyle = '#2b3566'; g.fillRect(px, py, T, T);
      g.fillStyle = '#4656a8'; g.fillRect(px, py, T, 6);
      g.fillStyle = '#1a2145'; g.fillRect(px, py + T - 6, T, 6);
      continue;
    }
    g.fillStyle = (x + y) % 2 ? '#121a3d' : '#0f1634'; g.fillRect(px, py, T, T);
    if (c === 'L') {
      g.fillStyle = '#ff4d00'; g.fillRect(px, py, T, T);
      g.fillStyle = '#ffb300';
      for (let i = 0; i < 3; i++) g.fillRect(px + ((i * 17 + now * 20) % (T - 10)), py + 8 + i * 14 + Math.sin(now * 3 + x + i) * 3, 10, 5);
    } else if (c === 'P') ring(px, py, '#ff8a3d', open, now);
    else if (c === 'Q') ring(px, py, '#22d3ee', open2, now);
    else if (c === 'D') door(px, py, open, '#a855f7', '#6b21a8');
    else if (c === 'F') door(px, py, open2, '#06b6d4', '#0e7490');
    else if (c === 'U') {
      g.fillStyle = '#22c55e'; g.fillRect(px + 6, py + 12, T - 12, T - 24);
      g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center';
      g.fillText('⬆', px + T / 2, py + T / 2 + 8 - Math.abs(Math.sin(now * 5)) * 6);
    } else if (c === 'X') {
      g.fillStyle = on ? '#ef4444' : warn ? '#fca5a5' : '#475085';
      for (let i = 0; i < 3; i++) {
        const bx = px + 4 + i * 14;
        g.beginPath();
        if (on) { g.moveTo(bx, py + T - 6); g.lineTo(bx + 7, py + 8); g.lineTo(bx + 14, py + T - 6); }
        else { g.moveTo(bx + 3, py + T - 6); g.lineTo(bx + 7, py + T - 14); g.lineTo(bx + 11, py + T - 6); }
        g.fill();
      }
    } else if (c === 'E') {
      g.fillStyle = '#22c55e'; g.shadowColor = '#22c55e'; g.shadowBlur = 14 + Math.sin(now * 4) * 6;
      g.fillRect(px + 4, py + 4, T - 8, T - 8); g.shadowBlur = 0;
      g.fillStyle = '#052e16'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center';
      g.fillText('EXIT', px + T / 2, py + T / 2 + 5);
    } else if (c === 'C' && !coins.has(x + ',' + y)) {
      const w = Math.abs(Math.cos(now * 3 + x));
      g.fillStyle = '#ffd23f'; g.shadowColor = '#ffd23f'; g.shadowBlur = 12;
      g.beginPath(); g.ellipse(px + T / 2, py + T / 2 + Math.sin(now * 4 + x) * 3, 4 + 9 * w, 11, 0, 0, 7); g.fill(); g.shadowBlur = 0;
    }
  }
  // ghost path preview
  g.setLineDash([3, 7]); g.lineWidth = 2;
  ghosts.forEach((gh, i) => {
    g.strokeStyle = GHOST_COLORS[i % 3] + '55'; g.beginPath();
    gh.forEach((q, j) => { if (j % 4 === 0) j ? g.lineTo(q.x * T, q.y * T) : g.moveTo(q.x * T, q.y * T); });
    g.stroke();
  });
  g.setLineDash([]);
  ghosts.forEach((gh, i) => body(gh[Math.min(t, gh.length - 1)], GHOST_COLORS[i % 3], 0.6, now));
  if (S !== 'won') {
    const gr = g.createRadialGradient(p.x * T, p.y * T, 4, p.x * T, p.y * T, 80);
    gr.addColorStop(0, '#38e8ff33'); gr.addColorStop(1, '#38e8ff00');
    g.fillStyle = gr; g.fillRect(p.x * T - 80, p.y * T - 80, 160, 160);
    body(p, '#38e8ff', 1, now);
  }
  for (const q of parts) { g.globalAlpha = Math.max(0, q.l / 0.6); g.fillStyle = q.c; g.fillRect(q.x, q.y, 4, 4); }
  g.globalAlpha = 1;
  if (flashA > 0) { g.fillStyle = `rgba(56,232,255,${flashA * 0.35})`; g.fillRect(0, 0, cv.width, cv.height); flashA -= 0.05; }
  g.restore();
  const left = lvTime() - t / FPS;
  $('fill').style.width = (left / lvTime() * 100) + '%';
  $('time').textContent = left.toFixed(1) + 's';
}

function frame(ts) {
  const d = Math.min(0.1, (ts - last) / 1000 || 0); last = ts;
  if (S === 'play') { acc += d; while (acc >= DT) { step(); acc -= DT; if (S !== 'play') break; } }
  parts = parts.filter(q => { q.l -= d; q.x += q.vx * d; q.y += q.vy * d; q.vy += 200 * d; return q.l > 0; });
  draw(); requestAnimationFrame(frame);
}

// ---------- controls ----------
const KEYS = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
addEventListener('keydown', e => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (KEYS[key]) { k[KEYS[key]] = 1; e.preventDefault(); }
  else if (key === ' ') { jumpBuf = 8; e.preventDefault(); }
  else if (key === 'Enter' || key === 'r') {
    if ($('menu').classList.contains('show')) return;
    S === 'card' ? $('go').click() : endLoop(); e.preventDefault();
  } else if (key === 'Escape') showMenu();
});
addEventListener('keyup', e => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (KEYS[key]) k[KEYS[key]] = 0;
});
document.querySelectorAll('[data-k]').forEach(b => {
  const n = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); n === 'jump' ? (jumpBuf = 8) : (k[n] = 1); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { if (n !== 'jump') k[n] = 0; }));
});
$('rewind').onclick = endLoop;
$('restart').onclick = () => { if (S === 'card') return; S = 'play'; ghosts = []; loop = 0; resetLoop(); toast('↻ Level restarted'); };
$('help').onclick = showIntro;
$('skip').onclick = skip;

// start on the first level you have not finished
let startLv = 0;
while (startLv < LEVELS.length - 1 && (SAVE.stars[startLv] || 0) > 0) startLv++;
soundLabels();
loadLevel(startLv);
requestAnimationFrame(frame);