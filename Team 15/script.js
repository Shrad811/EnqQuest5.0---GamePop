(function () {
  // =====================================================================
  //  POWER-UP REGISTRY
  //  To add a new power-up, add one entry here. Fields:
  //    name, icon, color      how it looks (glob + panel row)
  //    dur                    base seconds (scaled by the "Power-up length" setting)
  //    maxStacks              how many times collecting it again can raise its strength
  //    weight                 how often it spawns compared with the others
  //    desc                   text for the screen reader label
  //    buzz, tone             haptic pattern and [freq, seconds, wave] for the pickup
  //    instant: true          runs once via run(x, y) instead of lasting
  //  Then read it in the game with has('id') and stacks('id').
  // =====================================================================
  var EFFECTS = {
    freeze: { name: 'Freeze',        icon: '❄',  color: 'var(--ice)',    dur: 5,  maxStacks: 1, weight: 3, desc: 'stops the clock and every glob timer',
              buzz: [30, 20, 30, 20, 80], tone: [880, 0.3, 'triangle'] },
    double: { name: 'Double points', icon: '×2', color: 'var(--gold)',   dur: 8,  maxStacks: 3, weight: 3, desc: 'multiplies points',
              buzz: [25, 25, 25], tone: [740, 0.2, 'triangle'] },
    surge:  { name: 'Time surge',    icon: '⚡', color: 'var(--surge)',  dur: 8,  maxStacks: 3, weight: 3, desc: 'greens give more time',
              buzz: [20, 20, 50], tone: [990, 0.2, 'sawtooth'] },
    slow:   { name: 'Slow clock',    icon: '⏳', color: 'var(--slow)',   dur: 7,  maxStacks: 3, weight: 3, desc: 'clock drains slower',
              buzz: [50, 30, 50], tone: [330, 0.35, 'sine'] },
    big:    { name: 'Big globs',    icon: '🔍', color: 'var(--big)',    dur: 9,  maxStacks: 3, weight: 3, desc: 'globs get bigger',
              buzz: [30, 30], tone: [520, 0.2, 'triangle'] },
    shield: { name: 'Shield',        icon: '🛡', color: 'var(--shield)', dur: 14, maxStacks: 3, weight: 2, desc: 'blocks red globs',
              buzz: [15, 15, 15, 15, 40], tone: [600, 0.25, 'triangle'] },
    sweep:  { name: 'Sweep',         icon: '💥', color: 'var(--sweep)',  instant: true, weight: 2, desc: 'collects every green glob on screen',
              buzz: [20, 30, 20, 30, 120], tone: [200, 0.4, 'sawtooth'], run: function () { sweep(); } },
    wind:   { name: 'Wind-up',       icon: '🧶', color: 'var(--wind)',   dur: 6,  maxStacks: 3, weight: 2, desc: 'scroll to wind the clock and add time',
              buzz: [15, 15, 15, 15], tone: [700, 0.15, 'triangle'] }
  };
  var POOL = [];
  Object.keys(EFFECTS).forEach(function (id) {
    for (var i = 0; i < EFFECTS[id].weight; i++) POOL.push(id);
  });

  // ---------- Presets and slider definitions ----------
  var PRESETS = {
    easy:   { start: 20, globs: 12, levels: 3, gain: 0.9, penalty: 1, red: 10, power: 16, powerTime: 1.3, speed: 0.8, size: 1.2 },
    normal: { start: 15, globs: 15, levels: 3, gain: 0.7, penalty: 2, red: 15, power: 12, powerTime: 1,   speed: 1,   size: 1   },
    hard:   { start: 12, globs: 20, levels: 4, gain: 0.5, penalty: 3, red: 30, power: 8,  powerTime: 0.8, speed: 1.4, size: 0.85 }
  };
  var CONTROLS = [
    { key: 'start',     label: 'Starting time',        min: 8,   max: 40,  step: 1,   unit: 's', help: 'Clock at the start of level 1. Each later level has 1s less.' },
    { key: 'globs',    label: 'Globs in level 1',    min: 5,   max: 40,  step: 1,   unit: '',  help: 'Each later level needs 5 more.' },
    { key: 'levels',    label: 'Number of levels',     min: 1,   max: 6,   step: 1,   unit: '',  help: '' },
    { key: 'gain',      label: 'Time per green glob', min: 0.2, max: 2,   step: 0.1, unit: 's', help: '' },
    { key: 'penalty',   label: 'Red glob penalty',    min: 0,   max: 6,   step: 0.5, unit: 's', help: '' },
    { key: 'red',       label: 'Red glob chance',     min: 0,   max: 50,  step: 1,   unit: '%', help: 'Rises by 10 points each level.' },
    { key: 'power',     label: 'Power-up chance',      min: 0,   max: 30,  step: 1,   unit: '%', help: 'Chance that a glob is a glowing power-up.' },
    { key: 'powerTime', label: 'Power-up length',      min: 0.5, max: 2,   step: 0.1, unit: 'x', help: 'Scales how long every power-up lasts.' },
    { key: 'speed',     label: 'Game speed',           min: 0.5, max: 2,   step: 0.1, unit: 'x', help: 'Higher means globs appear and vanish faster.' },
    { key: 'size',      label: 'Glob size',           min: 0.6, max: 1.6, step: 0.1, unit: 'x', help: 'Bigger globs are easier to tap.' }
  ];

  // ---------- Elements ----------
  var $ = function (id) { return document.getElementById(id); };
  var arena = $('arena'), ov = $('ov'), setEl = $('set'), frost = $('frost'), aura = $('aura');
  var timeEl = $('time'), fill = $('fill'), fzEl = $('fz');
  var goalEl = $('goal'), levelEl = $('level'), pointsEl = $('points'), comboEl = $('combo'), bestEl = $('best');
  var muteBtn = $('mute'), setBtn = $('settingsBtn');
  var rwEl = $('rw'), pauseBtn = $('pauseBtn'), hList = $('hlist'), hCount = $('hcount'), toastEl = $('toast'), screenEl = $('screen');
  var fxEl = $('fx'), fxList = $('fxlist'), fxCount = $('fxcount'), fxEmpty = $('fxempty');

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Settings storage ----------
  function defaults() {
    var o = {};
    for (var k in PRESETS.normal) o[k] = PRESETS.normal[k];
    o.preset = 'normal'; o.sound = true; o.haptics = true; o.theme = 'auto';
    return o;
  }
  function loadSettings() {
    var s = defaults();
    try {
      var saved = JSON.parse(localStorage.getItem('btc-settings'));
      if (saved) for (var k in s) if (saved[k] !== undefined) s[k] = saved[k];
    } catch (e) {}
    return s;
  }
  function saveSettings() { try { localStorage.setItem('btc-settings', JSON.stringify(S)); } catch (e) {} }
  var KEYS = { classic: 'btc-best', endless: 'btc-best-endless' };
  function loadBest(m) { try { return parseInt(localStorage.getItem(KEYS[m]), 10) || 0; } catch (e) { return 0; } }
  function saveBest() { bests[mode] = highScore; try { localStorage.setItem(KEYS[mode], String(highScore)); } catch (e) {} }

  var S = loadSettings();
  var bests = { classic: loadBest('classic'), endless: loadBest('endless') };
  var mode = 'classic', endless = false, elapsed = 0, highScore = bests.classic;

  // ---------- State ----------
  var lvl = 0, hits = 0, left = 0, startTime = 15, points = 0, combo = 0, lastWhole = 99;
  var last, raf, spawnT, auraKey = '';
  var running = false, paused = false, shards = [], charges = 0;
  var ac = null;
  var active = {};   // id -> { t: seconds left, total: biggest t seen, stacks }
  var rows = {};     // id -> <li> in the panel

  // ---------- Sound and haptics ----------
  function applyTheme() {
    if (S.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', S.theme);
  }
  function applySound() { muteBtn.textContent = S.sound ? 'Sound on' : 'Sound off'; }
  function beep(freq, dur, type) {
    if (!S.sound) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.08, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + dur);
    } catch (e) {}
  }
  function buzz(pattern) {
    if (!S.haptics || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) {}
  }
  muteBtn.onclick = function () { S.sound = !S.sound; saveSettings(); applySound(); };

  // ---------- Effect helpers ----------
  function has(id) { return !!active[id]; }
  function stacks(id) { return active[id] ? active[id].stacks : 0; }

  function tier() { return endless ? Math.min(8, Math.floor(hits / 12)) : lvl; }   // endless: harder every 12 globs
  function L() {
    var t = tier();
    return {
      goal: S.globs + lvl * 5,
      start: Math.max(6, S.start - t),
      spawn: Math.max(250, (700 - t * 100) / S.speed),
      life: Math.max(550, (1400 - t * 250) / S.speed),
      red: Math.min(0.7, S.red / 100 + t * 0.1)
    };
  }
  function sizeFor() {
    var shrink = endless ? Math.min(hits, 40) * 0.6 : hits * 1.2;
    return Math.max(36, Math.round((72 - shrink - tier() * 4) * S.size * (1 + 0.25 * stacks('big'))));
  }
  function comboMult() { return 1 + Math.floor(combo / 3); }
  function pointsMult() { return comboMult() * (1 + stacks('double')); }

  function addEffect(id, x, y) {
    var def = EFFECTS[id];
    unlockHint(id);
    burst(x, y, def.color, 16);
    note(x, y, def.name, def.color);
    beep.apply(null, def.tone);
    buzz(def.buzz);
    if (def.instant) { def.run(x, y); return; }

    var dur = def.dur * S.powerTime, a = active[id];
    if (a) {                                   // already active: extend and strengthen
      a.t = Math.min(a.t + dur, dur * 3);
      a.total = Math.max(a.total, a.t);
      if (a.stacks < def.maxStacks) a.stacks++;
      var li = rows[id];
      li.classList.remove('bump'); void li.offsetWidth; li.classList.add('bump');
    } else {
      active[id] = { t: dur, total: dur, stacks: 1 };
      addRow(id);
    }
    renderFx();
  }

  function removeEffect(id) {
    delete active[id];
    var li = rows[id];
    delete rows[id];
    if (li) { li.classList.add('out'); setTimeout(function () { li.remove(); }, 250); }
  }

  function clearEffects() {
    active = {}; rows = {}; auraKey = '';
    fxList.innerHTML = '';
    frost.style.opacity = 0;
    aura.style.opacity = 0;
    fzEl.textContent = '';
    renderFx();
  }

  // ---------- Effects panel ----------
  function addRow(id) {
    var d = EFFECTS[id], li = document.createElement('li');
    li.className = 'fxrow';
    li.style.setProperty('--c', d.color);
    li.innerHTML = '<span class="fxi"></span><span class="fxn"><span class="nm"></span> <b class="fxs"></b></span>' +
      '<span class="fxt"></span><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></div>';
    li.querySelector('.fxi').textContent = d.icon;
    li.querySelector('.nm').textContent = d.name;
    li.querySelector('.bar').setAttribute('aria-label', d.name + ' time left');
    fxList.appendChild(li);
    rows[id] = li;
  }

  function renderFx() {
    var ids = Object.keys(active);
    ids.forEach(function (id) {
      var a = active[id], li = rows[id];
      if (!li) return;
      var pct = Math.max(0, a.t / a.total * 100);
      li.querySelector('.fxt').textContent = a.t.toFixed(1) + 's';
      li.querySelector('.fxs').textContent = a.stacks > 1 ? '×' + a.stacks : '';
      li.querySelector('.bar i').style.width = pct + '%';
      li.querySelector('.bar').setAttribute('aria-valuenow', Math.round(pct));
      li.classList.toggle('ending', a.t < 2);
    });
    fxCount.textContent = ids.length;
    fxEmpty.hidden = ids.length > 0;
    fxEl.classList.toggle('stacked', ids.length >= 2);
    renderAura(ids);
  }

  // Ring around the arena built from the colors of every active effect
  function renderAura(ids) {
    var key = ids.join();
    if (key === auraKey) return;
    auraKey = key;
    if (!ids.length) { aura.style.opacity = 0; return; }
    var cols = ids.map(function (i) { return EFFECTS[i].color; });
    if (cols.length === 1) cols = [cols[0], cols[0]];
    aura.style.background = 'conic-gradient(from var(--ang,0deg),' + cols.join(',') + ',' + cols[0] + ')';
    aura.style.setProperty('--w', (2 + ids.length) + 'px');
    aura.style.opacity = ids.length > 1 ? 1 : 0.55;
  }

  // ---------- HUD ----------
  function updateHud() {
    levelEl.textContent = endless ? 'Endless' : 'Level ' + (lvl + 1) + ' / ' + S.levels;
    goalEl.textContent = endless ? hits + ' globs' : hits + ' / ' + L().goal;
    pointsEl.textContent = points + ' pts';
    comboEl.textContent = combo >= 3 ? 'Purr streak x' + combo + ' (points x' + pointsMult() + ')' : '';
    bestEl.textContent = 'Best: ' + highScore;
  }
  function draw() {
    var frozen = has('freeze');
    timeEl.textContent = left.toFixed(1);
    timeEl.className = frozen ? 'frozen' : (left < 5 ? 'low' : '');
    fill.className = frozen ? 'frozen' : '';
    fill.style.width = Math.min(100, left / startTime * 100) + '%';
    fzEl.textContent = frozen ? '❄ Frozen ' + active.freeze.t.toFixed(1) + 's' : '';
    // frost stays full, then fades slowly over the last 2.5 seconds
    frost.style.opacity = frozen ? Math.min(1, active.freeze.t / 2.5) : 0;
  }

  // ---------- Visual effects ----------
  function note(x, y, txt, c) {
    var f = document.createElement('div');
    f.className = 'float';
    f.textContent = txt;
    f.style.color = c;
    f.style.left = x + 'px';
    f.style.top = y + 'px';
    arena.appendChild(f);
    setTimeout(function () { f.remove(); }, 700);
  }
  function burst(x, y, color, n) {
    if (reduced) return;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('i'), a = Math.random() * 6.283, d = 30 + Math.random() * 55;
      p.className = 'pt';
      p.style.cssText = 'left:' + x + 'px;top:' + y + 'px;background:' + color +
        ';--dx:' + (Math.cos(a) * d).toFixed(0) + 'px;--dy:' + (Math.sin(a) * d).toFixed(0) + 'px';
      arena.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 650); })(p);
    }
    var r = document.createElement('i');
    r.className = 'ring';
    r.style.cssText = 'left:' + x + 'px;top:' + y + 'px;border-color:' + color;
    arena.appendChild(r);
    setTimeout(function () { r.remove(); }, 550);
  }
  function shake() {
    if (reduced) return;
    arena.classList.remove('shake'); void arena.offsetWidth; arena.classList.add('shake');
  }
  function celebrate() {
    var cols = ['var(--good)', 'var(--gold)', 'var(--ice)', 'var(--sweep)'];
    for (var i = 0; i < 8; i++) {
      burst(Math.random() * arena.clientWidth, Math.random() * arena.clientHeight, cols[i % 4], 14);
    }
  }

  // ---------- Spawning ----------
  function spawn() {
    if (!running) return;
    var cfg = L(), s = sizeFor();
    var w = arena.clientWidth, h = arena.clientHeight;
    var r = Math.random(), type = 'g', fx = null;
    if (r < cfg.red) type = 'b';
    else if (r < cfg.red + S.power / 100) { type = 'p'; fx = POOL[Math.floor(Math.random() * POOL.length)]; }

    var b = document.createElement('button');
    b.className = 't ' + type;
    if (type === 'b') {
      b.textContent = '💦';
      b.setAttribute('aria-label', 'Spray bottle, loses time');
    } else if (type === 'p') {
      var d = EFFECTS[fx];
      b.textContent = d.icon;
      b.style.setProperty('--c', d.color);
      b.setAttribute('data-fx', fx);
      b.setAttribute('aria-label', 'Power-up: ' + d.name + ', ' + d.desc);
    } else {
      b.textContent = '🐟';
      b.setAttribute('aria-label', 'Fish, collect');
    }
    b.style.width = b.style.height = s + 'px';
    b.style.fontSize = Math.round(s * 0.46) + 'px';
    b.style.left = (7 + Math.random() * Math.max(1, w - s - 14)) + 'px';
    b.style.top = (7 + Math.random() * Math.max(1, h - s - 14)) + 'px';
    b.onpointerdown = function (e) { e.preventDefault(); hit(b, type, e); };
    b.insertAdjacentHTML('beforeend', '<svg class="rt" viewBox="0 0 100 100" aria-hidden="true"><circle class="tr" cx="50" cy="50" r="46"/><circle class="tm" cx="50" cy="50" r="46" pathLength="100"/></svg>');
    arena.appendChild(b);

    var life = Math.max(500, cfg.life - hits * 20) * (1 + 0.5 * stacks('slow'));
    shards.push({ el: b, life: life, left: life, ring: b.querySelector('.tm') });   // expiry is driven by tick() so Freeze can hold it
    spawnT = setTimeout(spawn, Math.max(220, cfg.spawn - hits * 10));
  }

  // ---------- Hitting globs ----------
  function collect(x, y) {
    combo++; hits++;
    var gain = (S.gain + Math.min(combo, 5) * 0.1) * (1 + 0.5 * stacks('surge'));
    left += gain;
    points += 10 * pointsMult();
    note(x, y, '+' + gain.toFixed(1) + 's', 'var(--good)');
    burst(x, y, 'var(--good)', 8 + Math.min(combo, 8));
    beep(440 + combo * 40, 0.12, 'square');
    buzz(Math.min(10 + combo * 3, 40));
    if (hits % 4 === 0 && charges < 3) { charges++; renderRw(); note(x, y - 24, 'Paw charged', 'var(--gold)'); }
    updateHud();
    if (!endless && hits >= L().goal) { levelDone(); return true; }
    return false;
  }

  function hit(b, type, e) {
    if (!running) return;
    var r = arena.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    var fx = b.getAttribute('data-fx');
    b.remove();

    if (type === 'b') {
      if (has('shield')) {
        var a = active.shield;
        a.stacks--;
        if (a.stacks <= 0) removeEffect('shield');
        note(x, y, 'Blocked!', 'var(--shield)');
        burst(x, y, 'var(--shield)', 12);
        beep(600, 0.15, 'triangle');
        buzz([15, 20, 15]);
      } else {
        left -= S.penalty;
        combo = 0;
        note(x, y, '-' + S.penalty + 's', 'var(--bad)');
        burst(x, y, 'var(--bad)', 12);
        shake();
        beep(140, 0.25, 'sawtooth');
        buzz([60, 40, 90]);
      }
    } else if (type === 'p') {
      addEffect(fx, x, y);
    } else {
      collect(x, y);
    }
    updateHud();
  }

  // Sweep: grabs every green glob on screen and pops the red ones
  function sweep() {
    shake();
    var list = arena.querySelectorAll('.t.g, .t.b');
    Array.prototype.forEach.call(list, function (el) {
      if (!running) return;
      var s = el.offsetWidth, x = el.offsetLeft + s / 2, y = el.offsetTop + s / 2;
      var isGreen = el.classList.contains('g');
      el.remove();
      if (isGreen) collect(x, y);
      else burst(x, y, 'var(--bad)', 8);
    });
  }

  // ---------- Game loop ----------
  function tick(t) {
    if (!running) return;
    var dt = Math.min(0.1, (t - last) / 1000);   // capped so a hidden tab doesn't burn the clock
    last = t;
    elapsed += dt;

    Object.keys(active).forEach(function (id) {
      active[id].t -= dt;
      if (active[id].t <= 0) removeEffect(id);
    });
    var frozen = has('freeze');
    if (!frozen) left -= dt / (1 + stacks('slow'));
    for (var i = shards.length - 1; i >= 0; i--) {
      var sh = shards[i];
      if (!sh.el.parentNode) { shards.splice(i, 1); continue; }
      if (!frozen) sh.left -= dt * 1000;
      if (sh.left <= 0) { sh.el.remove(); shards.splice(i, 1); continue; }
      sh.ring.style.strokeDashoffset = (100 * (1 - sh.left / sh.life)).toFixed(1);
    }

    if (left <= 0) { left = 0; draw(); return gameOver(); }

    var whole = Math.ceil(left);
    if (left < 3 && !has('freeze') && whole !== lastWhole) {
      lastWhole = whole; buzz(25); beep(300, 0.05, 'square');
    }
    draw();
    renderFx();
    raf = requestAnimationFrame(tick);
  }
  function stopLoop() {
    running = false; paused = false; shards = [];
    setBtn.disabled = false; pauseBtn.disabled = true;
    cancelAnimationFrame(raf);
    clearTimeout(spawnT);
    arena.querySelectorAll('.t,.float,.pt,.ring').forEach(function (n) { n.remove(); });
    clearEffects();
  }

  // ---------- Hints: each power-up unlocks a tip the first time you grab it ----------
  var HINTS = {
    freeze: 'Stops the clock and every glob timer. Tap freely.',
    double: 'Stacks up to 4x points on top of your combo multiplier.',
    surge:  'Each stack adds 50% to the time greens give you.',
    slow:   'Clock drains slower and globs stay on screen longer.',
    big:    'Each stack makes globs 25% bigger. Great for fast taps.',
    shield: 'Each stack blocks one red glob without breaking your combo.',
    sweep:  'Instantly collects every green on screen. Save it for a crowded moment.',
    wind:   'While active, scroll the wheel or swipe two fingers to add time. The more you scroll, the more you get. Stacks speed it up.'
  };
  function loadHints() { try { return JSON.parse(localStorage.getItem('btc-hints')) || {}; } catch (e) { return {}; } }
  var unlocked = loadHints(), fresh = {}, toastT;

  function renderHints() {
    var items = [
      { icon: '🐟', color: 'var(--good)', name: 'Fish', text: 'Tap for +' + S.gain + 's and points. Three in a row raises your streak multiplier.' },
      { icon: '💦', color: 'var(--bad)',  name: 'Spray',      text: 'Costs ' + S.penalty + 's and resets your streak. Skip it.' },
      { icon: '⟲', color: 'var(--gold)', name: 'Rewind',     text: 'Every 4 fish charges a paw. Scroll, swipe or press Space to refill every glob timer and gain 2s.' }
    ];
    Object.keys(EFFECTS).forEach(function (id) {
      if (unlocked[id]) items.push({ id: id, icon: EFFECTS[id].icon, color: EFFECTS[id].color, name: EFFECTS[id].name, text: HINTS[id] });
    });
    hList.innerHTML = '';
    items.forEach(function (it) {
      var li = document.createElement('li');
      li.className = 'hrow';
      li.style.setProperty('--c', it.color);
      li.innerHTML = '<span class="hi"></span><div><b></b><small></small></div>';
      li.querySelector('.hi').textContent = it.icon;
      li.querySelector('b').textContent = it.name;
      li.querySelector('small').textContent = it.text;
      if (it.id && fresh[it.id]) {
        var m = document.createElement('i'); m.className = 'new'; m.textContent = 'New';
        li.querySelector('b').appendChild(m);
      }
      hList.appendChild(li);
    });
    hCount.textContent = items.length;
  }
  function toast(txt, c) {
    toastEl.textContent = txt;
    toastEl.style.setProperty('--c', c);
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2200);
  }
  function unlockHint(id) {
    if (unlocked[id]) return;
    unlocked[id] = true; fresh[id] = true;
    try { localStorage.setItem('btc-hints', JSON.stringify(unlocked)); } catch (e) {}
    renderHints();
    toast('Hint unlocked: ' + EFFECTS[id].name, EFFECTS[id].color);
  }

  // ---------- Rewind: scroll wheel, trackpad swipe or Space ----------
  function renderRw() {
    var h = '<span>Rewind</span>';
    for (var k = 0; k < 3; k++) h += '<i class="' + (k < charges ? 'on' : '') + '"></i>';
    rwEl.innerHTML = h;
    rwEl.title = 'Scroll, swipe with two fingers, or press Space';
  }
  function rewind() {
    if (!running) return;
    var w = arena.clientWidth, h = arena.clientHeight;
    if (charges < 1) { note(w / 2, h / 2, 'Catch 4 fish to charge', 'var(--mut)'); return; }
    charges--; renderRw();
    shards.forEach(function (sh) { sh.left = sh.life; });
    left += 2;
    burst(w / 2, h / 2, 'var(--gold)', 18);
    note(w / 2, h / 2, 'Rewind +2s', 'var(--gold)');
    beep(520, 0.25, 'sine'); buzz([20, 20, 40]);
    updateHud();
  }
  // Wind-up power-up: every bit of scroll turns into clock time while it lasts
  var windAdd = 0, windT = 0;
  function windScroll(e) {
    var k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;
    var gain = Math.min(300, (Math.abs(e.deltaY) + Math.abs(e.deltaX)) * k) * 0.01 * stacks('wind');
    left += gain; windAdd += gain;
    var now = performance.now();
    if (now - windT > 180 && windAdd > 0.05) {
      note(arena.clientWidth / 2 + (Math.random() - 0.5) * 60, arena.clientHeight / 2, '+' + windAdd.toFixed(1) + 's', 'var(--wind)');
      windAdd = 0; windT = now; beep(300 + Math.random() * 200, 0.06, 'triangle'); buzz(8);
    }
    draw();
  }
  var wAcc = 0, wLock = false, wT;
  document.addEventListener('wheel', function (e) {
    if (!running || !e.target.closest || !e.target.closest('#main')) return;
    e.preventDefault();
    if (has('wind')) { windScroll(e); return; }
    clearTimeout(wT);
    wT = setTimeout(function () { wLock = false; wAcc = 0; }, 250);   // one spend per scroll gesture, even with trackpad inertia
    if (wLock) return;
    var k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;
    wAcc += (Math.abs(e.deltaY) + Math.abs(e.deltaX)) * k;
    if (wAcc >= 60) { wLock = true; rewind(); }
  }, { passive: false });

  function togglePause() {
    if (!running && !paused) return;
    if (!paused) {
      paused = true; running = false;
      cancelAnimationFrame(raf); clearTimeout(spawnT);
      showOverlay('Paused', 'Take a breather. The clock is waiting.', 'Resume', togglePause);
    } else {
      paused = false; ov.style.display = 'none'; running = true;
      last = performance.now(); raf = requestAnimationFrame(tick); spawn();
    }
  }
  pauseBtn.onclick = togglePause;
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && running) { e.preventDefault(); rewind(); }
    else if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && running) togglePause(); });

  // ---------- Full screens: menu, lost, won ----------
  var screenKind = '';
  function dialHtml(cls, label) {
    var t = '';
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a), r1 = i % 3 === 0 ? 38 : 41;
      t += '<line x1="' + (50 + c * r1).toFixed(1) + '" y1="' + (50 + s * r1).toFixed(1) +
        '" x2="' + (50 + c * 45).toFixed(1) + '" y2="' + (50 + s * 45).toFixed(1) +
        '" stroke-width="' + (i % 3 === 0 ? 2.4 : 1.2) + '"/>';
    }
    return '<div class="dial ' + cls + '"><svg class="ears" viewBox="0 0 100 30" aria-hidden="true"><path d="M14 30 L19 3 L43 25 Z"/><path d="M86 30 L81 3 L57 25 Z"/></svg><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="rim" cx="50" cy="50" r="48"/><g class="ticks">' +
      t + '</g></svg><div class="spin"></div><b>' + label + '</b></div>';
  }
  function stat(v, l) { return '<div class="st"><b>' + v + '</b><span>' + l + '</span></div>'; }

  function showScreen(kind, isNew) {
    var h = '<div class="sc">';
    if (kind === 'menu') {
      h += dialHtml('', S.start + '.0') + '<h1>Beat the Clock</h1><p class="sub"></p>' +
        '<ul class="legend"><li><span class="dot g"></span>Fish: tap it</li><li><span class="dot b"></span>Spray: skip it</li><li><span class="dot p"></span>Power-up</li></ul>' +
        (bests.classic || bests.endless ? '<div class="btnrow">' +
          (bests.classic ? '<span class="badge">Classic best: ' + bests.classic + '</span>' : '') +
          (bests.endless ? '<span class="badge">Endless best: ' + bests.endless + '</span>' : '') + '</div>' : '') +
        '<div class="btnrow"><button class="go big" id="scGo">Classic</button><button class="go big" id="scEnd">Endless</button></div>' +
        '<button class="ghost" id="scSet">Settings</button>';
    } else {
      var won = kind === 'won';
      h += dialHtml(won ? 'win' : 'dead', won ? '&#10003;' : '0.0') +
        '<h2>' + (won ? 'You beat the clock' : 'Time is up') + '</h2><p class="sub">' + (won ? 'Purr-fect. The cat approves.' : 'The cat knocked the clock off the table.') + '</p><div class="stats-grid">' +
        (won ? stat(S.levels, 'Levels') + stat(points, 'Points') + stat(highScore, 'Best')
             : (endless ? stat(points, 'Points') + stat(hits, 'Globs') + stat(Math.round(elapsed) + 's', 'Survived')
                      : stat(lvl + 1, 'Level') + stat(points, 'Points') + stat(hits + '/' + L().goal, 'Globs'))) +
        '</div>' +
        (isNew ? '<span class="badge">New best score!</span>'
               : (!won && highScore > points ? '<p class="gap">' + (highScore - points) + ' pts to beat your best</p>' : '')) +
        '<div class="btnrow"><button class="go big" id="scGo">' + (won ? 'Play again' : 'Try again') + '</button><button class="ghost" id="scMenu">Menu</button></div>';
    }
    screenEl.innerHTML = h + '</div>';
    if (kind === 'menu') screenEl.querySelector('.sub').textContent = introText();
    screenKind = kind;
    screenEl.classList.add('on');
    $('scGo').onclick = function () { newGame(kind === 'menu' ? 'classic' : mode); };
    if ($('scEnd')) $('scEnd').onclick = function () { newGame('endless'); };
    if ($('scSet')) $('scSet').onclick = openSettings;
    if ($('scMenu')) $('scMenu').onclick = function () { showScreen('menu'); };
    $('scGo').focus();
  }

  // ---------- Screens ----------
  function showOverlay(title, text, btnLabel, onClick) {
    ov.innerHTML = '<h2></h2><p></p><button class="go"></button>';
    ov.children[0].textContent = title;
    ov.children[1].textContent = text;
    ov.children[2].textContent = btnLabel;
    ov.children[2].onclick = onClick;
    ov.style.display = 'flex';
    ov.children[2].focus();
  }
  function introText() {
    return 'Tap fish for time and streaks. Spray costs ' + S.penalty +
      's. Glowing globs are power-ups. Every 4 fish charges a paw: scroll or press Space to rewind every timer. Classic has ' +
      S.levels + ' levels, Endless never stops.';
  }

  function levelDone() {
    stopLoop();
    celebrate();
    beep(660, 0.2, 'triangle');
    buzz([40, 40, 40, 40, 120]);
    if (lvl < S.levels - 1) {
      showOverlay('Level ' + (lvl + 1) + ' cleared',
        'Score so far: ' + points + '. Next level is faster, with more red globs.',
        'Start level ' + (lvl + 2),
        function () { lvl++; startLevel(); });
    } else {
      var isNew = points > highScore;
      if (isNew) { highScore = points; saveBest(); }
      updateHud();
      showScreen('won', isNew);
    }
  }
  function gameOver() {
    stopLoop();
    beep(110, 0.5, 'sawtooth');
    buzz([200, 60, 200]);
    var isNew = points > highScore;
    if (isNew) { highScore = points; saveBest(); }
    updateHud();
    showScreen('lost', isNew);
  }

  // ---------- Starting ----------
  function startLevel() {
    ov.style.display = 'none';
    screenEl.classList.remove('on');
    setEl.hidden = true;
    setBtn.disabled = true;
    hits = 0; combo = 0; lastWhole = 99; paused = false; pauseBtn.disabled = false;
    clearEffects();
    startTime = L().start;
    left = startTime;
    running = true;
    updateHud();
    draw();
    last = performance.now();
    raf = requestAnimationFrame(tick);
    spawn();
  }
  function newGame(m) {
    mode = m === 'endless' ? 'endless' : 'classic';
    endless = mode === 'endless';
    highScore = bests[mode];
    lvl = 0; points = 0; elapsed = 0; fresh = {};
    charges = 0; renderRw(); renderHints(); startLevel();
  }

  // ---------- Settings screen ----------
  function fmt(c, v) { return v + c.unit; }

  function buildSettings() {
    var h = '<h2>Settings</h2><div class="presets" role="group" aria-label="Difficulty presets">';
    ['easy', 'normal', 'hard'].forEach(function (p) {
      h += '<button data-p="' + p + '" aria-pressed="' + (S.preset === p) + '">' + p[0].toUpperCase() + p.slice(1) + '</button>';
    });
    h += '</div>';
    CONTROLS.forEach(function (c) {
      h += '<div class="ctl"><label for="c_' + c.key + '">' + c.label + '</label>' +
        '<output id="o_' + c.key + '">' + fmt(c, S[c.key]) + '</output>' +
        '<input type="range" id="c_' + c.key + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + S[c.key] + '">' +
        (c.help ? '<small>' + c.help + '</small>' : '') + '</div>';
    });
    h += '<div class="ctl"><label for="c_sound">Sound effects</label><input type="checkbox" id="c_sound"' + (S.sound ? ' checked' : '') + '></div>';
    h += '<div class="ctl"><label for="c_haptics">Haptics (vibration)</label><input type="checkbox" id="c_haptics"' + (S.haptics ? ' checked' : '') + '>' +
      '<small>Works on phones that support vibration. iPhones do not.</small></div>';
    h += '<div class="ctl"><label for="c_theme">Theme</label>' +
      '<select id="c_theme"><option value="auto">Match device</option><option value="light">Light</option><option value="dark">Dark</option></select></div>';
    h += '<div class="setbtns"><button class="go" id="setDone">Done</button><button class="ghost" id="setReset">Reset to Normal</button></div>';
    setEl.innerHTML = h;
    $('c_theme').value = S.theme;

    setEl.querySelectorAll('.presets button').forEach(function (b) {
      b.onclick = function () {
        var p = PRESETS[b.getAttribute('data-p')];
        for (var k in p) S[k] = p[k];
        S.preset = b.getAttribute('data-p');
        saveSettings(); buildSettings();
      };
    });
    CONTROLS.forEach(function (c) {
      var inp = $('c_' + c.key);
      inp.oninput = function () {
        S[c.key] = parseFloat(inp.value);
        $('o_' + c.key).textContent = fmt(c, S[c.key]);
        S.preset = 'custom';
        setEl.querySelectorAll('.presets button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        saveSettings();
      };
    });
    $('c_sound').onchange = function (e) { S.sound = e.target.checked; applySound(); saveSettings(); };
    $('c_haptics').onchange = function (e) { S.haptics = e.target.checked; saveSettings(); if (S.haptics) buzz(40); };
    $('c_theme').onchange = function (e) { S.theme = e.target.value; applyTheme(); saveSettings(); };
    $('setReset').onclick = function () {
      var keep = { sound: S.sound, haptics: S.haptics, theme: S.theme };
      S = defaults(); S.sound = keep.sound; S.haptics = keep.haptics; S.theme = keep.theme;
      saveSettings(); buildSettings();
    };
    $('setDone').onclick = closeSettings;
  }
  function openSettings() {
    if (running) return;
    buildSettings();
    setEl.hidden = false;
    $('setDone').focus();
  }
  function closeSettings() {
    setEl.hidden = true;
    lvl = Math.min(lvl, S.levels - 1);
    renderHints();
    updateHud();
    if (screenEl.classList.contains('on') && screenKind === 'menu') showScreen('menu');
    else setBtn.focus();
  }
  setBtn.onclick = openSettings;

  // ---------- Intro ----------
  applyTheme();
  applySound();
  updateHud();
  renderFx();
  renderHints(); renderRw();
  showScreen('menu');
})();