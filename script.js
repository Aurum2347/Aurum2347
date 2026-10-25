const THEME_KEY = 'a-theme';
(function () {
  const root = document.documentElement;
  root.classList.add('js');
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) {}
})();

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const icon = id => `<svg><use href="#${id}"/></svg>`;

const QR = (function () {
  const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255] })();
  const gm = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
  function gp(n) { let g = [1]; for (let i = 0; i < n; i++) { const t = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { t[j] ^= g[j]; t[j + 1] ^= gm(g[j], EXP[i]) } g = t } return g }
  function rs(d, e) { const g = gp(e), r = d.slice(); for (let i = 0; i < e; i++) r.push(0); for (let i = 0; i < d.length; i++) { const f = r[i]; if (f) for (let j = 0; j < g.length; j++) r[i + j] ^= gm(g[j], f) } return r.slice(d.length) }
  const EC = {
    L: { 1: [7, [1], [19]], 2: [10, [1], [34]], 3: [15, [1], [55]], 4: [20, [1], [80]], 5: [26, [1], [108]], 6: [18, [2], [68]], 7: [20, [2], [78]], 8: [24, [2], [97]], 9: [30, [2], [116]], 10: [18, [2, 2], [68, 69]] },
    M: { 1: [10, [1], [16]], 2: [16, [1], [28]], 3: [26, [1], [44]], 4: [18, [2], [32]], 5: [24, [2], [43]], 6: [16, [4], [27]], 7: [18, [4], [31]], 8: [22, [2, 2], [38, 39]], 9: [22, [3, 2], [36, 37]], 10: [26, [4, 1], [43, 44]] }
  };
  const AL = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
  const FB = { L: 1, M: 0, Q: 3, H: 2 };
  function dcw(v, e) { const t = EC[e][v]; let s = 0; for (let i = 0; i < t[1].length; i++) s += t[1][i] * t[2][i]; return s }
  const ccb = v => v < 10 ? 8 : 16;
  const cap = (v, e) => Math.floor((dcw(v, e) * 8 - 4 - ccb(v)) / 8);
  function pick(len, e) { for (let v = 1; v <= 10; v++) if (cap(v, e) >= len) return v; return -1 }

  function build(ver, ecl, data) {
    const size = ver * 4 + 17, mod = new Uint8Array(size * size), fn = new Uint8Array(size * size);
    const sf = (r, c, v) => { mod[r * size + c] = v ? 1 : 0; fn[r * size + c] = 1 };
    for (let i = 0; i < size; i++) { sf(6, i, i % 2 === 0); sf(i, 6, i % 2 === 0) }
    const fd = (cr, cc) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const r = cr + dy, c = cc + dx; if (r < 0 || r >= size || c < 0 || c >= size) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); sf(r, c, d !== 2 && d !== 4) } };
    fd(3, 3); fd(3, size - 4); fd(size - 4, 3);
    const ap = AL[ver] || [];
    for (let i = 0; i < ap.length; i++) for (let j = 0; j < ap.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) sf(ap[i] + dy, ap[j] + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    if (ver >= 7) {
      let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); const vb = (ver << 12) | r;
      for (let i = 0; i < 18; i++) { const b = ((vb >>> i) & 1) === 1, a = size - 11 + i % 3, c = Math.floor(i / 3); sf(c, a, b); sf(a, c, b) }
    }
    const fmt = m => { let d = (FB[ecl] << 3) | m, r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); return ((d << 10) | r) ^ 0x5412 };
    const putF = (arr, m) => {
      const b = fmt(m), g = i => (b >>> i) & 1;
      for (let i = 0; i <= 5; i++) arr[i * size + 8] = g(i);
      arr[7 * size + 8] = g(6); arr[8 * size + 8] = g(7); arr[8 * size + 7] = g(8);
      for (let i = 9; i < 15; i++) arr[8 * size + (14 - i)] = g(i);
      for (let i = 0; i < 8; i++) arr[8 * size + (size - 1 - i)] = g(i);
      for (let i = 8; i < 15; i++) arr[(size - 15 + i) * size + 8] = g(i);
      arr[(size - 8) * size + 8] = 1;
    };
    putF(mod, 0);
    let idx = 0; const tot = data.length * 8;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v;
        if (!fn[y * size + x] && idx < tot) { mod[y * size + x] = (data[idx >>> 3] >>> (7 - (idx & 7))) & 1; idx++ }
      }
    }
    const mf = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2 + (x * y) % 3) === 0,
      (x, y) => (((x * y) % 2 + (x * y) % 3) % 2) === 0, (x, y) => (((x + y) % 2 + (x * y) % 3) % 2) === 0];
    function pen(m) {
      let p = 0; const a = (y, x) => m[y * size + x];
      for (let y = 0; y < size; y++) { let r = 1; for (let x = 1; x < size; x++) { if (a(y, x) === a(y, x - 1)) r++; else { if (r >= 5) p += 3 + (r - 5); r = 1 } } if (r >= 5) p += 3 + (r - 5) }
      for (let x = 0; x < size; x++) { let r = 1; for (let y = 1; y < size; y++) { if (a(y, x) === a(y - 1, x)) r++; else { if (r >= 5) p += 3 + (r - 5); r = 1 } } if (r >= 5) p += 3 + (r - 5) }
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const v = a(y, x); if (v === a(y, x + 1) && v === a(y + 1, x) && v === a(y + 1, x + 1)) p += 3 }
      const A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
      const mt = (s, q) => { for (let i = 0; i < 11; i++) if (s[i] !== q[i]) return false; return true };
      for (let y = 0; y < size; y++) for (let x = 0; x + 11 <= size; x++) { const s = []; for (let i = 0; i < 11; i++) s.push(a(y, x + i)); if (mt(s, A) || mt(s, B)) p += 40 }
      for (let x = 0; x < size; x++) for (let y = 0; y + 11 <= size; y++) { const s = []; for (let i = 0; i < 11; i++) s.push(a(y + i, x)); if (mt(s, A) || mt(s, B)) p += 40 }
      let dk = 0; for (let i = 0; i < m.length; i++) dk += m[i];
      const pc = dk * 100 / (size * size), pv = Math.floor(pc / 5) * 5;
      p += Math.min(Math.abs(pv - 50) / 5, Math.abs(pv + 5 - 50) / 5) * 10;
      return p;
    }
    let best = null, bp = Infinity;
    for (let m = 0; m < 8; m++) {
      const c = mod.slice();
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { if (fn[y * size + x]) continue; if (mf[m](x, y)) c[y * size + x] ^= 1 }
      putF(c, m);
      const p = pen(c);
      if (p < bp) { bp = p; best = c }
    }
    return { size, mod: best };
  }

  function make(text) {
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) bytes.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    let e = 'M', v = pick(bytes.length, e);
    if (v < 0) { e = 'L'; v = pick(bytes.length, e) }
    if (v < 0) throw new Error('too long');
    const dc = dcw(v, e), bits = [], put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1) };
    put(4, 4); put(bytes.length, ccb(v)); bytes.forEach(b => put(b, 8));
    const tot = dc * 8;
    for (let i = 0; i < 4 && bits.length < tot; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    const cw = [];
    for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; cw.push(b) }
    let pad = 0; while (cw.length < dc) cw.push(pad++ % 2 ? 0x11 : 0xEC);
    const t = EC[e][v], ecPer = t[0], cnt = t[1], dl = t[2], bl = [], ec = [];
    let off = 0;
    for (let g = 0; g < cnt.length; g++) for (let k = 0; k < cnt[g]; k++) { const d = cw.slice(off, off + dl[g]); off += dl[g]; bl.push(d); ec.push(rs(d, ecPer)) }
    const data = [], md = Math.max(...bl.map(b => b.length));
    for (let i = 0; i < md; i++) for (let b = 0; b < bl.length; b++) if (i < bl[b].length) data.push(bl[b][i]);
    for (let i = 0; i < ecPer; i++) for (let b = 0; b < ec.length; b++) data.push(ec[b][i]);
    return build(v, e, data);
  }

  function svg(text, q = 2) {
    const r = make(text), n = r.size + q * 2; let d = '';
    for (let y = 0; y < r.size; y++) {
      let x = 0;
      while (x < r.size) {
        if (r.mod[y * r.size + x]) { const s = x; while (x < r.size && r.mod[y * r.size + x]) x++; d += `M${s + q} ${y + q}h${x - s}v1h${s - x}z` }
        else x++;
      }
    }
    return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="#09090b"/></svg>`;
  }
  return { svg };
})();

const STACK = [
  { n: 'JavaScript', a: 'JS', c: 'Language', l: 90, s: 'core' }, { n: 'TypeScript', a: 'TS', c: 'Language', l: 78, s: 'core' },
  { n: 'Python', a: 'PY', c: 'Language', l: 72, s: 'core' }, { n: 'HTML5', a: 'H5', c: 'Markup', l: 95, s: 'core' },
  { n: 'CSS3', a: 'C3', c: 'Styling', l: 92, s: 'core' }, { n: 'React', a: 'RE', c: 'Frontend', l: 70, s: 'working' },
  { n: 'Vue', a: 'VU', c: 'Frontend', l: 62, s: 'working' }, { n: 'Svelte', a: 'SV', c: 'Frontend', l: 55, s: 'touched' },
  { n: 'Angular', a: 'NG', c: 'Frontend', l: 50, s: 'touched' }, { n: 'Node.js', a: 'NO', c: 'Backend', l: 70, s: 'working' },
  { n: 'Tailwind', a: 'TW', c: 'Styling', l: 82, s: 'working' }, { n: 'Git', a: 'GT', c: 'Tooling', l: 88, s: 'core' },
  { n: 'Docker', a: 'DK', c: 'Tooling', l: 58, s: 'touched' }, { n: 'Rust', a: 'RS', c: 'Language', l: 40, s: 'touched' },
  { n: 'Go', a: 'GO', c: 'Language', l: 38, s: 'touched' }, { n: 'C++', a: 'C+', c: 'Language', l: 45, s: 'touched' },
  { n: 'Figma', a: 'FG', c: 'Design', l: 64, s: 'working' }
];
const STATUS_BADGE = { core: 'solid', working: '', touched: 'outline' };

const AVATAR_FILES = ['img/avatar.png', 'img/avatar.jpg', 'img/avatar.jpeg', 'img/avatar.webp'];

function loadAvatar() {
  const tryNext = i => {
    if (i >= AVATAR_FILES.length) return;
    const im = new Image();
    im.onload = () => applyAvatar(im, AVATAR_FILES[i]);
    im.onerror = () => tryNext(i + 1);
    im.src = AVATAR_FILES[i];
  };
  tryNext(0);
}

function applyAvatar(im, src) {
  $$('[data-avatar]').forEach(box => {
    const img = document.createElement('img');
    img.src = src; img.alt = ''; img.decoding = 'async';
    box.prepend(img);
    box.classList.add('has-img');
  });

  let href = src;
  try {
    const s = 128, c = document.createElement('canvas'), x = c.getContext('2d');
    const m = Math.min(im.naturalWidth, im.naturalHeight);
    c.width = c.height = s;
    x.beginPath();
    if (x.roundRect) x.roundRect(0, 0, s, s, 28); else x.rect(0, 0, s, s);
    x.clip();
    x.drawImage(im, (im.naturalWidth - m) / 2, (im.naturalHeight - m) / 2, m, m, 0, 0, s, s);
    href = c.toDataURL('image/png');
  } catch (e) {}
  const fav = $('#favicon');
  if (fav) { fav.type = 'image/png'; fav.href = href }
  const apple = document.createElement('link');
  apple.rel = 'apple-touch-icon'; apple.href = src;
  document.head.appendChild(apple);
}

function initBackground() {
  const cv = $('#bgCanvas'); if (!cv || !cv.getContext) return {};
  const ctx = cv.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, gap = 26, rgb = '250,250,250', raf = 0;
  let mx = -9999, my = -9999, tx = -9999, ty = -9999;

  const readColor = () => { rgb = getComputedStyle(document.documentElement).getPropertyValue('--rgb').trim() || rgb };
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    gap = w > 1800 ? 30 : w < 600 ? 22 : 26;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function draw(t) {
    mx += (tx - mx) * .12; my += (ty - my) * .12;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = `rgb(${rgb})`;
    const shift = (scrollY * .2) % gap, time = t * .0011;
    for (let y = -gap; y < h + gap; y += gap) {
      const py = y - shift;
      for (let x = gap / 2; x < w; x += gap) {
        const dx = x - mx, dy = py - my, d = Math.sqrt(dx * dx + dy * dy);
        const near = Math.max(0, 1 - d / 230);
        const wave = (Math.sin(x * .011 + py * .007 - time) + 1) / 2;
        const r = .7 + near * 1.3 + wave * .35;
        const push = near * near * 12, ox = d ? dx / d * push : 0, oy = d ? dy / d * push : 0;
        ctx.globalAlpha = .07 + wave * .1 + near * .55;
        ctx.fillRect(x + ox - r, py + oy - r, r * 2, r * 2);
      }
    }
    ctx.globalAlpha = 1;
    if (!still) raf = requestAnimationFrame(draw);
  }
  const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw) };

  readColor(); resize(); start();
  addEventListener('resize', () => { resize(); if (still) start() });
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { tx = e.clientX; ty = e.clientY } }, { passive: true });
  document.addEventListener('pointerleave', () => { tx = ty = -9999 });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else if (!still) start() });
  if (still) addEventListener('scroll', start, { passive: true });
  return { recolor: () => { readColor(); if (still) start() } };
}

function initBlock() {
  const cube = $('#mcCube'); if (!cube) return;
  let seed = 2347;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const tex = shade => {
    const c = document.createElement('canvas'), x = c.getContext('2d');
    c.width = c.height = 16;
    for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
      const v = shade(px, py);
      x.fillStyle = `rgb(${v},${v},${v})`;
      x.fillRect(px, py, 1, 1);
    }
    return `url(${c.toDataURL()})`;
  };
  const grass = () => 150 + Math.floor(rnd() * 5) * 13;
  const dirt = () => 72 + Math.floor(rnd() * 4) * 13;
  const side = (px, py) => py < 3 || (py === 3 && rnd() < .5) ? grass() : dirt();
  try {
    cube.style.setProperty('--tex-top', tex(grass));
    cube.style.setProperty('--tex-side', tex(side));
    cube.style.setProperty('--tex-bottom', tex(dirt));
  } catch (e) {}
}

function toast(title, msg, ico = 'i-check') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon(ico)}<div class="m"><b></b><span></span></div>`;
  el.querySelector('b').textContent = title;
  el.querySelector('span').textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 180) }, 2500);
}

async function copyText(txt) {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(txt); return true } } catch (e) {}
  try {
    const t = document.createElement('textarea');
    t.value = txt; t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t); t.select();
    const ok = document.execCommand('copy'); t.remove(); return ok;
  } catch (e) { return false }
}

async function doCopy(txt, label, btn) {
  if (await copyText(txt)) {
    toast(label || 'Скопировано', txt, 'i-copy');
    if (btn) { btn.classList.add('ok'); setTimeout(() => btn.classList.remove('ok'), 1100) }
  } else toast('Не скопировалось', txt, 'i-err');
}

const pad2 = n => String(n).padStart(2, '0');
function mskTime() {
  try {
    const f = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const p = f.formatToParts(new Date()), g = t => (p.find(x => x.type === t) || {}).value || '00';
    return { h: +g('hour') % 24, m: g('minute'), s: g('second') };
  } catch (e) {
    const n = new Date(); return { h: n.getHours(), m: pad2(n.getMinutes()), s: pad2(n.getSeconds()) };
  }
}
const dayPart = h => h >= 5 && h < 12 ? 'утро' : h >= 12 && h < 18 ? 'день' : h >= 18 && h < 23 ? 'вечер' : 'ночь';

let lastFocus = null;
function openOverlay(el, focusEl) {
  lastFocus = document.activeElement;
  el.classList.add('on'); el.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => (focusEl || el.querySelector('button, a, input'))?.focus(), 50);
}
function closeOverlay(el) {
  if (!el.classList.contains('on')) return;
  el.classList.remove('on'); el.setAttribute('aria-hidden', 'true');
  if (!$('.overlay.on')) document.body.style.overflow = '';
  if (lastFocus && lastFocus.focus) lastFocus.focus();
  el.dispatchEvent(new Event('close'));
}

document.addEventListener('DOMContentLoaded', () => {

  loadAvatar();
  const bg = initBackground();
  initBlock();

  const SOC = $$('.soc').map(li => ({
    n: li.dataset.name, h: li.dataset.handle, c: li.dataset.copy, u: li.dataset.url, i: li.dataset.icon, el: li
  }));
  const PROJECTS = $$('article[data-url]').map(a => ({
    t: a.dataset.title, h: a.dataset.hint, u: a.dataset.url, i: a.dataset.icon, cat: a.dataset.cat, el: a
  }));

  const root = document.documentElement;
  const currentTheme = () => root.getAttribute('data-theme') ||
    (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  const syncMeta = () => { const m = $('meta[name=theme-color]'); if (m) m.content = currentTheme() === 'dark' ? '#09090b' : '#ffffff' };
  function flipTheme() {
    const t = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t) } catch (e) {}
    syncMeta();
    if (bg.recolor) bg.recolor();
    toast(t === 'dark' ? 'Тёмная тема' : 'Светлая тема', 'Оформление переключено', t === 'dark' ? 'i-moon' : 'i-sun');
  }
  syncMeta();
  $('#themeBtn').addEventListener('click', flipTheme);
  matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => { syncMeta(); if (bg.recolor) bg.recolor() });

  document.addEventListener('click', e => {
    const c = e.target.closest('[data-copy]');
    if (c) { e.preventDefault(); doCopy(c.dataset.copy, c.dataset.label, c) }
  });

  const allContacts = () => ['Aurum2347 - контакты', '',
    ...SOC.map(s => `${s.n}: ${s.c}`), '',
    ...PROJECTS.map(p => `${p.t}: ${p.u}`), '',
    'Почту не принимаю - пишите в Telegram.'].join('\n');
  const copyAll = btn => doCopy(allContacts(), 'Все контакты', btn);
  $('#copyAll').addEventListener('click', e => copyAll(e.currentTarget));

  function tick() {
    const t = mskTime(), hm = `${pad2(t.h)}:${t.m}`;
    $('#clkShort').textContent = hm;
    $('#clkFull').textContent = hm;
    $('#dayPart').textContent = dayPart(t.h);
    $('#dayPartShort').textContent = dayPart(t.h);
  }
  tick(); setInterval(tick, 1000);

  const grid = PROJECTS.filter(p => p.cat);
  const projFilter = $('#projFilter');
  $$('.tab', projFilter).forEach(t => {
    const n = t.dataset.f === 'all' ? grid.length : grid.filter(p => p.cat === t.dataset.f).length;
    t.querySelector('.n').textContent = pad2(n);
  });
  projFilter.addEventListener('click', e => {
    const t = e.target.closest('.tab'); if (!t) return;
    $$('.tab', projFilter).forEach(x => x.classList.toggle('on', x === t));
    grid.forEach(p => { p.el.hidden = t.dataset.f !== 'all' && p.cat !== t.dataset.f });
  });
  $('#projTotal').firstChild.textContent = PROJECTS.length;

  const words = PROJECTS.map(p => `<span>${p.t}</span><em>✦</em>`).join('');
  $('#marquee').innerHTML = words + words;

  document.addEventListener('pointermove', e => {
    const card = e.target.closest && e.target.closest('.spot');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });

  const tzDlg = $('#tzDlg'); let tzTimer = null;
  function updateTz() {
    const m = mskTime(), n = new Date();
    const y = { h: n.getHours(), m: pad2(n.getMinutes()), s: pad2(n.getSeconds()) };
    $('#tzMy').innerHTML = `${pad2(m.h)}:${m.m}<small>:${m.s}</small>`;
    $('#tzYou').innerHTML = `${pad2(y.h)}:${y.m}<small>:${y.s}</small>`;
    $('#tzMyPart').textContent = dayPart(m.h);
    $('#tzYouPart').textContent = dayPart(y.h);
    let tz = 'У тебя';
    try { const z = Intl.DateTimeFormat().resolvedOptions().timeZone; if (z) tz = z.split('/').pop().replace(/_/g, ' ') } catch (e) {}
    $('#tzYouLabel').textContent = tz;
    const diff = 180 + n.getTimezoneOffset(), dh = Math.abs(diff / 60);
    const fmt = x => Number.isInteger(x) ? x : x.toFixed(1).replace('.', ',');
    const tail = `У меня <i>${dayPart(m.h)}</i>, у тебя - <i>${dayPart(y.h)}</i>. Лучше писать вечером по моему времени.`;
    $('#tzDiff').innerHTML = Math.abs(diff) < 1
      ? `<div><b>Мы в одном часовом поясе.</b> Сейчас у нас обоих <i>${dayPart(m.h)}</i> - писать можно в любое время.</div>`
      : `<div>Ты <b>на ${fmt(dh)} ч ${diff > 0 ? 'позади' : 'впереди'}</b> моего времени (UTC+3). ${tail}</div>`;
  }
  function openTz() { updateTz(); tzTimer = setInterval(updateTz, 1000); openOverlay(tzDlg) }
  tzDlg.addEventListener('close', () => { clearInterval(tzTimer); tzTimer = null });
  $('#tzOpen').addEventListener('click', openTz);

  const qrDlg = $('#qrDlg'); let qrIdx = 0;
  $('#qrTabs').innerHTML = SOC.map((s, i) =>
    `<button class="tab" data-q="${i}" title="${s.n}">${icon(s.i)}<span>${s.n.replace('Telegram · ', 'TG ')}</span></button>`).join('');
  function renderQR(i) {
    qrIdx = i; const s = SOC[i];
    $('#qrTitle').textContent = s.n;
    $('#qrHandle').textContent = s.u;
    $('#qrOpen').href = s.u;
    try { $('#qrBox').innerHTML = QR.svg(s.u, 2) }
    catch (e) { $('#qrBox').innerHTML = '<div style="display:grid;place-items:center;height:100%;color:#71717a;font-size:12px">QR недоступен</div>' }
    $$('#qrTabs .tab').forEach(b => b.classList.toggle('on', +b.dataset.q === i));
  }
  function openQR(i = 0) { renderQR(i); openOverlay(qrDlg, $('#qrCopy')) }
  $('#qrTabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) renderQR(+b.dataset.q) });
  $('#qrCopy').addEventListener('click', e => doCopy(SOC[qrIdx].c, SOC[qrIdx].n, e.currentTarget));
  SOC.forEach((s, i) => s.el.querySelector('[data-qr]').addEventListener('click', () => openQR(i)));

  $$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeOverlay(o) }));

  const filter = $('#stackFilter');
  const cats = ['Все', ...new Set(STACK.map(s => s.c))];
  filter.innerHTML = cats.map((c, i) => {
    const n = c === 'Все' ? STACK.length : STACK.filter(s => s.c === c).length;
    return `<button class="tab${i === 0 ? ' on' : ''}" role="tab" data-c="${c}">${c}<span class="n">${pad2(n)}</span></button>`;
  }).join('');
  function drawStack(cat) {
    const list = STACK.filter(s => cat === 'Все' || s.c === cat).sort((a, b) => b.l - a.l);
    $('#stackBody').innerHTML = list.map(s => `<tr>
      <td class="name"><span><em>${s.a}</em>${s.n}</span></td>
      <td><span class="badge outline">${s.c}</span></td>
      <td class="lvl"><span><span class="prog"><i data-w="${s.l}%"></i></span><small>${s.l}</small></span></td>
      <td><span class="badge ${STATUS_BADGE[s.s]}">${s.s}</span></td></tr>`).join('');
    const n = list.length;
    $('#stackCount').textContent = `${n} ${n === 1 ? 'запись' : n < 5 ? 'записи' : 'записей'}`;
    requestAnimationFrame(() => requestAnimationFrame(() => $$('#stackBody .prog i').forEach(i => i.style.width = i.dataset.w)));
  }
  drawStack('Все');
  filter.addEventListener('click', e => {
    const t = e.target.closest('.tab'); if (!t) return;
    $$('.tab', filter).forEach(x => x.classList.toggle('on', x === t));
    drawStack(t.dataset.c);
  });

  const accItems = $$('#acc .acc-i');
  accItems.forEach(item => item.querySelector('.acc-t').addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    accItems.forEach(x => { x.classList.remove('open'); x.querySelector('.acc-t').setAttribute('aria-expanded', 'false') });
    if (!wasOpen) { item.classList.add('open'); item.querySelector('.acc-t').setAttribute('aria-expanded', 'true') }
  }));

  const cmdk = $('#cmdk'), input = $('#cmdInput'), list = $('#cmdList');
  const go = sel => { const el = $(sel); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) };
  const open = u => window.open(u, '_blank', 'noopener');
  const CMDS = [
    { g: 'Соцсети' },
    ...SOC.flatMap((s, i) => [
      { t: `Открыть ${s.n}`, i: s.i, h: s.h, run: () => open(s.u) },
      { t: `Скопировать ${s.n}`, i: 'i-copy', h: s.c, run: () => doCopy(s.c, s.n) },
      { t: `QR-код ${s.n}`, i: 'i-qr', run: () => openQR(i) }
    ]),
    { g: 'Проекты' },
    ...PROJECTS.map(p => ({ t: p.t, i: p.i, h: p.h, run: () => open(p.u) })),
    { g: 'Разделы' },
    ...[['Соцсети', '#contact'], ['Рендеры Minecraft', '#renders'], ['Проекты', '#projects'], ['Стек', '#stack'], ['Философия', '#philosophy']]
      .map(([t, h]) => ({ t, i: 'i-arrow', run: () => go(h) })),
    { g: 'Действия' },
    { t: 'Скопировать все контакты', i: 'i-copy', run: () => copyAll() },
    { t: 'Сколько у меня времени', i: 'i-clock', run: openTz },
    { t: 'Переключить тему', i: 'i-sun', run: flipTheme }
  ];
  let sel = -1;

  function renderCmds(q = '') {
    const s = q.trim().toLowerCase();
    const items = CMDS.map((c, idx) => ({ ...c, idx }))
      .filter(c => c.g || !s || c.t.toLowerCase().includes(s) || (c.h && c.h.toLowerCase().includes(s)));
    const visible = items.filter((c, k) => !c.g || (items[k + 1] && !items[k + 1].g));
    const first = visible.find(c => !c.g);
    sel = first ? first.idx : -1;
    list.innerHTML = first
      ? visible.map(c => c.g
          ? `<div class="cmdk-g">${c.g}</div>`
          : `<button class="cmdk-item" data-i="${c.idx}">${icon(c.i)}<span class="t">${c.t}</span>${c.h ? `<span class="h">${c.h}</span>` : ''}</button>`).join('')
      : '<div class="cmdk-empty">Ничего не найдено</div>';
    mark();
  }
  function mark() {
    $$('.cmdk-item', list).forEach(e => e.classList.toggle('sel', +e.dataset.i === sel));
    const e = list.querySelector('.sel'); if (e) e.scrollIntoView({ block: 'nearest' });
  }
  function move(d) {
    const ids = $$('.cmdk-item', list).map(e => +e.dataset.i); if (!ids.length) return;
    sel = ids[(ids.indexOf(sel) + d + ids.length) % ids.length]; mark();
  }
  function runSel() {
    const c = CMDS[sel]; if (!c || !c.run) return;
    closeOverlay(cmdk); setTimeout(c.run, 80);
  }
  function openCmdk() { input.value = ''; renderCmds(''); openOverlay(cmdk, input) }

  input.addEventListener('input', e => renderCmds(e.target.value));
  list.addEventListener('click', e => { const b = e.target.closest('.cmdk-item'); if (b) { sel = +b.dataset.i; runSel() } });
  list.addEventListener('mousemove', e => { const b = e.target.closest('.cmdk-item'); if (b && +b.dataset.i !== sel) { sel = +b.dataset.i; mark() } });
  $('#cmdOpen').addEventListener('click', openCmdk);
  $('#cmdOpen2').addEventListener('click', openCmdk);

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      cmdk.classList.contains('on') ? closeOverlay(cmdk) : openCmdk();
      return;
    }
    if (e.key === 'Escape') { $$('.overlay.on').forEach(closeOverlay); return }
    if (!cmdk.classList.contains('on')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
    else if (e.key === 'Enter') { e.preventDefault(); runSel() }
  });

  const rv = $$('.rv');
  if (!('IntersectionObserver' in window)) { rv.forEach(el => el.classList.add('in')); return }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) }
  }), { threshold: .05, rootMargin: '0px 0px -32px 0px' });
  rv.forEach(el => io.observe(el));
});
