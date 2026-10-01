/* ==================================================================
   CIPHER DESK — where every telegram goes once it has been read
   ------------------------------------------------------------------
   Always open to the player from the Cipher desk button. When a slip
   in the bay is read and put down, it is lifted out of the machine
   and filed here as a page.

     · Filter: all pages, cipher (enciphered messages and keys) or
       plain (messages sent in clear).
     · An enciphered message is kept clipped to its key, so both are
       to hand. It is clipped automatically when a key with the same
       KEY NAME has come in, and the player can re-clip by hand: drag
       a key onto the message, or pull the key off its clip.
     · Drag pages to arrange them however you like; Tidy lays them
       out again. Arrow keys move a focused page, Enter reads it.
     · Plain telegrams that are the same stack into one pile: the same
       signal received again, or signals sharing a STACK name, such as
       the helm's recon report replies. Reading a stack reads the whole
       pile, newest first.

   Load after telex.js and before decoder.js, which works from the
   same records (TELEX.desk).
   ================================================================== */

(function () {
'use strict';

const T = window.TELEX;
const root = document.getElementById('desk');
if (!T || !T.cipher || !root) return;
const C = T.cipher;

const PAGE_W = 190;          // px, a filed page; desk.css narrows it on phones
const GAP = 22;              // between pages when laid out
const PAD = 20;              // inside the desk surface
const STEP = 20;             // arrow-key nudge; Shift moves three times as far

const el = {
  open:    document.getElementById('deskopen'),
  count:   document.getElementById('deskcount'),
  surface: document.getElementById('desksurface'),
  empty:   document.getElementById('deskempty'),
  tidy:    document.getElementById('desktidy'),
  close:   document.getElementById('deskclose'),
  filters: Array.prototype.slice.call(root.querySelectorAll('[data-filter]')),
  viewer:  document.getElementById('viewer')
};

/* Shared with decoder.js */
const store = {
  printed:  [],          // every signal printed, oldest first
  keys:     [],          // the key signals among them
  suspect:  new Set(),   // keys the player has judged forged
  work:     new Map(),   // message -> { key, unclipped, done: Set of letter indexes }
  verdicts: new Map(),   // signal  -> { choice, correct }
  pages:    new Map(),   // signal  -> the page it is filed on
  list:     []           // every page once, in filing order:
                         //   { sig, html, items: [{ sig, html }], el, paper, x, y }
};

let filter = 'all';
let topZ = 1;
let drag = null;
let swallow = false;
let openedFrom = null;   // the page being read, to refocus afterwards

/* ---------- small helpers --------------------------------------- */

function h(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function keyName(k) { return k.key_name || k.serial || k.id || 'KEY'; }
function norm(s) { return String(s || '').toUpperCase().replace(/\s+/g, ' ').trim(); }
function isOpen() { return !root.hidden; }

function workFor(sig) {
  if (!store.work.has(sig)) store.work.set(sig, { key: null, unclipped: false, done: new Set() });
  return store.work.get(sig);
}

/* key | cipher | plain. Keys and enciphered messages share the
   cipher filter. */
function kind(sig) {
  return sig.key ? 'key' : C.isEnciphered(sig) ? 'cipher' : 'plain';
}

/* A key is a loose page only while no filed message has it clipped. */
function clippedSomewhere(key) {
  for (const p of store.list) if (workFor(p.sig).key === key && kind(p.sig) === 'cipher') return true;
  return false;
}

function shown(page) {
  const k = kind(page.sig);
  if (k === 'key' && clippedSomewhere(page.sig)) return false;
  if (filter === 'cipher') return k !== 'plain';
  if (filter === 'plain')  return k === 'plain';
  return true;
}

/* Swallow the click a drag ends with, so letting go of a page doesn't
   also read it, or close something behind it. */
window.addEventListener('click', e => {
  if (!swallow) return;
  swallow = false;
  e.stopPropagation();
  e.preventDefault();
}, true);

function swallowClick() {
  swallow = true;
  setTimeout(() => { swallow = false; }, 0);
}

/* ---------- keys and their messages ----------------------------- */

function clip(msg, key) {
  const w = workFor(msg);
  w.key = key || null;
  w.unclipped = !key;                // the player took it off; don't re-clip it
  render();
}

/* Clip each enciphered message to the key it names, unless the player
   has already chosen or taken one off. */
function autoPair() {
  store.printed.forEach(m => {
    if (!C.isEnciphered(m) || !m.key_name) return;
    const w = workFor(m);
    if (w.key || w.unclipped) return;
    const k = store.keys.find(x => norm(x.key_name) === norm(m.key_name));
    if (k) w.key = k;
  });
}

/* ---------- filing ---------------------------------------------- */

/* Plain telegrams that are the same go on one stack: the same signal
   again, or any sharing a STACK name. Keys and enciphered messages keep
   a page each, since they are clipped together. */
function stackKey(sig) {
  if (kind(sig) !== 'plain') return null;
  return sig.stack ? 'stack:' + norm(sig.stack) : sig;
}

function file(sig, html) {
  const sk = stackKey(sig);
  if (!sk && store.pages.has(sig)) return store.pages.get(sig);
  let page = sk && store.list.find(p => p.stackKey === sk);
  if (page) {
    page.items.push({ sig: sig, html: html });
    page.sig = sig;                  // the newest goes on top
    page.html = html;
    store.pages.set(sig, page);
    fill(page);
    page.el.style.zIndex = ++topZ;
  } else {
    page = { sig: sig, html: html, items: [{ sig: sig, html: html }], stackKey: sk,
             el: null, paper: null, x: null, y: null, keyShown: undefined };
    store.pages.set(sig, page);
    store.list.push(page);
    build(page);
  }
  render();
  el.open.classList.remove('is-new');
  void el.open.offsetWidth;          // restart the flash
  el.open.classList.add('is-new');
  return page;
}

/* The top telegram shows on the desk; reading the stack reads them all,
   newest first. */
function fill(page) {
  page.paper.innerHTML = page.html;
  page.paper._signal = page.sig;     // so TELEX.open() can read it
  const rule = LF + LF + '- - - - - - - - - - - - - - - - - - -' + LF + LF;
  page.paper._html = page.items.length > 1
    ? page.items.slice().reverse().map(i => i.html).join(rule)
    : null;
  if (page.paper._html) {
    const t = document.createElement('div');
    t.innerHTML = page.paper._html;
    page.paper._text = t.textContent;
  } else {
    page.paper._text = null;
  }
}
const LF = String.fromCharCode(10);

function build(page) {
  const sig = page.sig;
  const n = h('div', 'page page--' + kind(sig));
  n.tabIndex = 0;
  n.setAttribute('role', 'button');
  n._page = page;

  page.keyEl = h('div', 'page__key');
  page.paper = h('div', 'page__paper slip');
  fill(page);
  page.count = h('span', 'page__count');
  page.stamp = h('span', 'page__stamp');
  page.label = h('span', 'page__label');

  n.appendChild(page.keyEl);
  n.appendChild(page.paper);
  n.appendChild(h('span', 'page__clip'));
  n.appendChild(page.count);
  n.appendChild(page.stamp);
  n.appendChild(page.label);
  n.addEventListener('click', () => read(page));
  n.addEventListener('keydown', e => pageKey(e, page));
  page.el = n;
  el.surface.appendChild(n);
}

/* ---------- drawing the desk ------------------------------------ */

function render() {
  let cipher = 0, plain = 0, any = 0;

  store.list.forEach(page => {
    const sig = page.sig;
    const k = kind(sig);
    const w = k === 'cipher' ? workFor(sig) : null;
    const key = w && w.key;

    if (!(k === 'key' && clippedSomewhere(sig))) {
      any++;
      if (k === 'plain') plain++; else cipher++;
    }

    /* The key clipped behind its message */
    if (page.keyShown !== key) {
      page.keyShown = key;
      page.keyEl.textContent = '';
      if (key) {
        const kp = store.pages.get(key);
        const paper = h('div', 'slip');
        if (kp) paper.innerHTML = kp.html;
        else paper.appendChild(h('span', 'page__keyname', keyName(key) + '\n(still in the machine)'));
        page.keyEl.appendChild(paper);
      }
      page.el.classList.toggle('is-packet', !!key);
    }

    /* What the player has made of it */
    const v = store.verdicts.get(sig);
    page.stamp.textContent = v ? (v.choice ? 'Genuine' : 'Suspect') : '';
    page.stamp.className = 'page__stamp' + (v ? (v.choice ? ' is-ok' : ' is-bad') : '');

    const many = page.items.length;
    page.count.textContent = many > 1 ? '×' + many : '';
    page.el.classList.toggle('is-stack', many > 1);
    let label = (many > 1 && sig.stack ? sig.stack : sig.serial || sig.id || 'Signal') + ' · ';
    if (k === 'key') label += 'key · ' + keyName(sig);
    else if (k === 'plain') label += 'plain' + (many > 1 ? ' · stack of ' + many : '');
    else {
      const total = C.lines(sig).join('').replace(/[^A-Z]/g, '').length || 1;
      label += 'cipher';
      if (key) label += ' + ' + keyName(key);
      if (key && w.done.size) {
        if (C.letters(key.key) !== C.letters(sig.keyword)) label += ' · doesn’t read';
        else if (w.done.size >= total) label += ' · decoded';
        else label += ' · ' + Math.round(w.done.size / total * 100) + '% decoded';
      }
    }
    page.label.textContent = label;
    page.el.setAttribute('aria-label', label + (v ? ', judged ' + page.stamp.textContent.toLowerCase() : '') +
      '. Enter to read, arrow keys to move.');

    page.el.hidden = !shown(page);
  });

  el.count.textContent = any;
  el.filters.forEach(b => {
    const f = b.dataset.filter;
    b.setAttribute('aria-pressed', String(f === filter));
    b.querySelector('b').textContent = f === 'all' ? any : f === 'cipher' ? cipher : plain;
  });

  const visible = store.list.filter(p => !p.el.hidden);
  el.empty.hidden = visible.length > 0;
  el.empty.textContent = any
    ? (filter === 'plain' ? 'No plain telegrams on the desk.' : 'No cipher telegrams on the desk.')
    : 'Nothing on the desk yet. Read a telegram and it is filed here.';

  if (isOpen()) visible.filter(p => p.x === null).forEach(place);
  visible.forEach(position);
}

function position(page) {
  if (page.x === null) return;
  page.el.style.left = page.x + 'px';
  page.el.style.top = page.y + 'px';
}

/* Put a page at the foot of the shortest column. */
function place(page) {
  const pw = page.el.offsetWidth || PAGE_W;
  const width = el.surface.clientWidth - PAD * 2;
  const cols = Math.max(1, Math.floor((width + GAP) / (pw + GAP)));
  const bottoms = new Array(cols).fill(PAD);
  store.list.forEach(p => {
    if (p === page || p.el.hidden || p.x === null) return;
    const col = Math.min(cols - 1, Math.max(0, Math.round((p.x - PAD) / (pw + GAP))));
    bottoms[col] = Math.max(bottoms[col], p.y + p.el.offsetHeight + GAP);
  });
  const col = bottoms.indexOf(Math.min.apply(null, bottoms));
  page.x = PAD + col * (pw + GAP);
  page.y = bottoms[col];
  position(page);
}

function tidy() {
  const visible = store.list.filter(p => !p.el.hidden);
  visible.forEach(p => { p.x = null; });
  visible.forEach(place);
  el.surface.scrollTop = 0;
}

function clamp(page) {
  const max = Math.max(0, el.surface.clientWidth - page.el.offsetWidth);
  page.x = Math.min(Math.max(0, page.x), max);
  page.y = Math.max(0, page.y);
}

/* ---------- reading a page -------------------------------------- */

function read(page) {
  openedFrom = page;
  page.el.style.zIndex = ++topZ;
  T.open(page.paper);
}

T.on('close', sig => {
  const slip = sig && T.take(sig);
  if (slip) {
    /* Read from the bay: file it, and put focus somewhere that still exists. */
    file(sig, slip.innerHTML);
    (isOpen() ? el.close : el.open).focus({ preventScroll: true });
  } else if (openedFrom && openedFrom.el.isConnected) {
    openedFrom.el.focus({ preventScroll: true });
    render();                        // the decoder may have changed it
  }
  openedFrom = null;
});

/* ---------- arranging pages ------------------------------------- */

function pageAt(x, y) {
  const hit = document.elementFromPoint(x, y);
  const n = hit && hit.closest('.page');
  return n && el.surface.contains(n) ? n._page : null;
}

el.surface.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const n = e.target.closest('.page');
  if (!n) return;
  const page = n._page;
  drag = {
    page: page,
    fromKey: !!e.target.closest('.page__key') && n.classList.contains('is-packet'),
    sx: e.clientX, sy: e.clientY,
    ox: page.x, oy: page.y,
    scroll: el.surface.scrollTop,
    moved: false,
    target: null
  };
});

window.addEventListener('pointermove', e => {
  if (!drag) return;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
    if (!lift()) return;
  }
  e.preventDefault();

  /* Scroll the desk when a page is carried to its edge */
  const r = el.surface.getBoundingClientRect();
  if (e.clientY > r.bottom - 40) el.surface.scrollTop += 14;
  else if (e.clientY < r.top + 40) el.surface.scrollTop -= 14;

  const p = drag.page;
  p.x = drag.ox + e.clientX - drag.sx;
  p.y = drag.oy + e.clientY - drag.sy + el.surface.scrollTop - drag.scroll;
  clamp(p);
  position(p);

  /* A key carried over an enciphered message clips to it */
  let target = null;
  if (kind(p.sig) === 'key') {
    const t = pageAt(e.clientX, e.clientY);
    if (t && t !== p && kind(t.sig) === 'cipher') target = t;
  }
  if (target !== drag.target) {
    if (drag.target) drag.target.el.classList.remove('is-target');
    if (target) target.el.classList.add('is-target');
    drag.target = target;
  }
});

/* The page starts moving. Pulling on the key behind a message takes it
   off the clip and carries the key instead. */
function lift() {
  if (drag.fromKey) {
    const msg = drag.page;
    const key = workFor(msg.sig).key;
    clip(msg.sig, null);
    const kp = store.pages.get(key);
    if (!kp || kp.el.hidden) { drag = null; return false; }
    kp.x = msg.x + 24;
    kp.y = Math.max(0, msg.y - 14);
    drag.page = kp;
    drag.ox = kp.x;
    drag.oy = kp.y;
    position(kp);
  }
  drag.moved = true;
  drag.page.el.classList.add('is-lifted');
  drag.page.el.style.zIndex = ++topZ;
  return true;
}

function drop(cancelled) {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (!d.moved) return;              // a plain click; the click handler reads it
  swallowClick();
  d.page.el.classList.remove('is-lifted');
  if (d.target) d.target.el.classList.remove('is-target');
  if (cancelled) {
    d.page.x = d.ox;
    d.page.y = d.oy;
    position(d.page);
  } else if (d.target) {
    clip(d.target.sig, d.page.sig);
    d.target.el.style.zIndex = ++topZ;
  }
  render();
}

window.addEventListener('pointerup', () => drop(false));
window.addEventListener('pointercancel', () => drop(true));

function pageKey(e, page) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    read(page);
    return;
  }
  const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (!d) return;
  e.preventDefault();
  const step = e.shiftKey ? STEP * 3 : STEP;
  page.x += d[0] * step;
  page.y += d[1] * step;
  clamp(page);
  page.el.style.zIndex = ++topZ;
  position(page);
  page.el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/* ---------- opening and closing the desk ------------------------ */

function openDesk() {
  if (isOpen()) return;
  root.hidden = false;
  el.open.setAttribute('aria-expanded', 'true');
  render();
  el.close.focus({ preventScroll: true });
}

function closeDesk() {
  if (!isOpen()) return;
  drop(true);
  root.hidden = true;
  el.open.setAttribute('aria-expanded', 'false');
  el.open.focus({ preventScroll: true });
}

el.open.addEventListener('click', () => isOpen() ? closeDesk() : openDesk());
el.close.addEventListener('click', closeDesk);
el.tidy.addEventListener('click', tidy);
el.filters.forEach(b => b.addEventListener('click', () => {
  filter = b.dataset.filter;
  render();
}));

/* Escape puts the desk away, unless it is closing the sheet in front. */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.defaultPrevented || !isOpen()) return;
  if (el.viewer && el.viewer.classList.contains('open')) return;
  if (T.isReading && T.isReading()) return;      // the helm's reading sheet
  e.preventDefault();
  closeDesk();
});

/* Pages keep their place if the window narrows. */
window.addEventListener('resize', () => {
  if (!isOpen()) return;
  store.list.forEach(p => { if (p.x !== null && !p.el.hidden) { clamp(p); position(p); } });
});

/* ---------- wiring ---------------------------------------------- */

T.on('printend', sig => {
  if (!sig) return;
  store.printed.push(sig);
  if (sig.key && store.keys.indexOf(sig) < 0) store.keys.push(sig);
  autoPair();
  render();
});

T.desk = {
  store:     store,
  workFor:   workFor,
  keyName:   keyName,
  clip:      clip,
  refresh:   render,
  swallowClick: swallowClick,
  open:      openDesk,
  close:     closeDesk,
  isOpen:    isOpen,
  file:      file,
  pages:     () => store.list.map(p => p.items.map(i => i.sig)),   // one array per page or stack
  keys:      () => store.keys.slice(),
  verdicts:  () => Array.from(store.verdicts, ([signal, v]) =>
                ({ signal: signal, choice: v.choice, correct: v.correct }))
};

render();

})();
