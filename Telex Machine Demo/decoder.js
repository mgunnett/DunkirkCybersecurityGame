/* ==================================================================
   CIPHER DESK TOOLS — decoding and checking signals
   ------------------------------------------------------------------
   Open beside the enlarged sheet for any signal that carries cipher
   or security-drill headers. Plain signals open exactly as before.

     KEY:      DYNAMO        a key signal. Filed in the key tray.
     CIPHER:   VIGENERE      printed enciphered. The player drags a key
     KEYWORD:  DYNAMO        into the slot, then drags across the
                             punched tape to decode it.
     GENUINE:  yes | no      asks the player to judge the signal, then
     CLUE 1:   quote | why   explains what gave it away, or why it
     LESSON:   ...           checks out.

   Load after telex.js and desk.js: the keys, decoding progress and
   verdicts are the desk's records (TELEX.desk). Every verdict is also announced on document as
   a 'telexverdict' event, for whatever scores the game.
   ================================================================== */

(function () {
'use strict';

const T = window.TELEX;
const desk = document.getElementById('tools');
if (!T || !T.cipher || !T.desk || !desk) return;
const D = T.desk;
const C = T.cipher;

/* ITA2, the five-unit code a teleprinter punches. Hole 1 first. */
const ITA2 = {
  A:'11000', B:'10011', C:'01110', D:'10010', E:'10000', F:'10110', G:'01011',
  H:'00101', I:'01100', J:'11010', K:'11110', L:'01001', M:'00111', N:'00110',
  O:'00011', P:'01101', Q:'11101', R:'01010', S:'10100', T:'00001', U:'11100',
  V:'01111', W:'11001', X:'10111', Y:'10101', Z:'10001', ' ':'00100'
};

const el = {
  viewer: document.getElementById('viewer'),
  wrap:   document.querySelector('#viewer .viewerwrap')
};

const state = {
  keys:     D.store.keys,       // key signals received, oldest first
  suspect:  D.store.suspect,    // key signals the player has judged forged
  verdicts: D.store.verdicts,   // signal -> { choice, correct }
  sig:      null                // the signal being worked on now
};
const workFor = D.workFor;            // message -> { key, done: Set of letter indexes }
const keyName = D.keyName;
const swallowClick = D.swallowClick;  // eat the click a drag ends with

let ui = null;            // the decoder's live parts, while one is shown
let drag = null;          // a key being carried to the slot

/* ---------- small builders -------------------------------------- */

function h(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

/* One column of tape: five data holes with the feed hole after the
   second, as on the real thing. */
function holes(ch) {
  const code = ITA2[ch] || '00000';
  const col = h('span', 'holes');
  for (let i = 0; i < 5; i++) {
    if (i === 2) col.appendChild(h('b'));
    col.appendChild(h('i', code[i] === '1' ? 'on' : ''));
  }
  return col;
}

function token(k, tag) {
  const t = h(tag || 'button', 'token');
  if (t.tagName === 'BUTTON') t.type = 'button';
  const strip = h('span', 'token__tape');
  for (const ch of C.letters(k.key)) strip.appendChild(holes(ch));
  t.appendChild(strip);
  t.appendChild(h('span', 'token__name', keyName(k)));
  t.appendChild(h('span', 'token__word', C.letters(k.key)));
  if (state.suspect.has(k)) {
    t.classList.add('is-suspect');
    t.title = 'You judged this key a forgery';
  }
  return t;
}

/* ---------- showing the desk ------------------------------------ */

function needsDesk(sig) {
  return !!sig && (!!sig.key || C.isEnciphered(sig) || sig.genuine !== undefined);
}

function show(sig) {
  hide();
  if (!needsDesk(sig)) return;
  state.sig = sig;
  desk.appendChild(h('div', 'tools__plate', 'Cipher desk'));
  if (sig.key) desk.appendChild(keyNote(sig));
  if (C.isEnciphered(sig)) desk.appendChild(decoder(sig));
  if (sig.genuine !== undefined) desk.appendChild(verdict(sig));
  desk.hidden = false;
  el.viewer.classList.add('has-tools');
  el.wrap.classList.add('has-tools');
}

function hide() {
  endDrag();
  ui = null;
  state.sig = null;
  desk.hidden = true;
  desk.textContent = '';
  el.viewer.classList.remove('has-tools');
  el.wrap.classList.remove('has-tools');
}

/* ---------- a key signal ---------------------------------------- */

function keyNote(sig) {
  const sec = h('section', 'tools__sec');
  sec.appendChild(h('h3', 'tools__head', 'Key tape'));
  const row = h('div', 'keynote');
  row.appendChild(token(sig, 'span'));
  row.appendChild(h('p', 'tools__text',
    'Filed in your key tray. On the desk it is clipped to the messages enciphered under ' +
    keyName(sig) + ', and you can drag it into the slot on any other.'));
  sec.appendChild(row);
  sec.appendChild(h('p', 'tools__note',
    'A key travels on its own, apart from the messages it unlocks. Anyone holding it ' +
    'can read your traffic and write traffic that reads as genuine, so it is never ' +
    'sent back down the line.'));
  return sec;
}

/* ---------- the decoder ----------------------------------------- */

function decoder(sig) {
  const sec = h('section', 'tools__sec');
  sec.appendChild(h('h3', 'tools__head', 'Decode — ' + (sig.key_name || 'day key')));

  ui = { cells: [], rows: [], range: null, cur: 0, dragging: false };

  const bench = h('div', 'bench');
  ui.slot = h('button', 'slot');
  ui.slot.type = 'button';
  ui.slot.addEventListener('click', () => { if (workFor(state.sig).key) setKey(null); });
  ui.tray = h('div', 'tray');
  ui.tray.setAttribute('role', 'group');
  ui.tray.setAttribute('aria-label', 'Key tray');
  bench.appendChild(ui.slot);
  bench.appendChild(ui.tray);
  sec.appendChild(bench);

  /* The key telegram itself, clipped to this one, so both can be read */
  ui.keypaper = h('div', 'keypaper');
  sec.appendChild(ui.keypaper);

  /* The tape, one row per printed line, one cell per character. */
  ui.tape = h('div', 'tape');
  ui.tape.tabIndex = 0;
  ui.tape.setAttribute('role', 'group');
  ui.tape.setAttribute('aria-label',
    'Punched tape. Drag across letters to decode them, or use the arrow keys, ' +
    'Shift to extend and Enter to decode.');
  ui.read = h('div', 'readout');
  ui.read.setAttribute('aria-label', 'Decoded text');

  let li = 0;
  C.lines(sig).forEach(line => {
    const row = h('div', line ? 'tape__row' : 'tape__row is-gap');
    const rowCells = [];
    for (const raw of line) {
      const ch = raw.toUpperCase();
      const letter = /[A-Z]/.test(ch);
      const cell = h('span', letter ? 'cell' : 'cell is-plain');
      const c = {
        el:  cell,
        n:   ui.cells.length,
        ch:  ch,
        li:  letter ? li++ : -1,
        key: h('span', 'cell__key'),
        out: h('span', 'cell__out')
      };
      cell.dataset.n = c.n;
      cell.appendChild(c.key);
      cell.appendChild(holes(ch));
      cell.appendChild(h('span', 'cell__ch', ch));
      cell.appendChild(c.out);
      row.appendChild(cell);
      rowCells.push(c);
      ui.cells.push(c);
    }
    ui.tape.appendChild(row);
    const readRow = h('div', 'readout__row');
    ui.read.appendChild(readRow);
    ui.rows.push({ cells: rowCells, el: readRow });
  });
  ui.letters = li;

  ui.tape.addEventListener('pointerdown', tapeDown);
  ui.tape.addEventListener('pointermove', tapeMove);
  ui.tape.addEventListener('pointerup', tapeUp);
  ui.tape.addEventListener('pointercancel', () => { ui.dragging = false; ui.range = null; paintRange(); });
  ui.tape.addEventListener('keydown', tapeKey);

  sec.appendChild(ui.tape);
  ui.status = h('p', 'tools__status');
  ui.status.setAttribute('aria-live', 'polite');
  sec.appendChild(ui.status);
  sec.appendChild(h('h4', 'tools__sub', 'Decoded'));
  sec.appendChild(ui.read);

  renderKeys();
  render();
  return sec;
}

function keyword() {
  const w = state.sig && workFor(state.sig);
  return w && w.key ? C.letters(w.key.key) : '';
}

function render() {
  if (!ui) return;
  const work = workFor(state.sig);
  const k = keyword();
  ui.cells.forEach(c => {
    if (c.li < 0) return;
    const kc = k ? k[c.li % k.length] : '';
    const done = !!k && work.done.has(c.li);
    c.key.textContent = kc;
    c.out.textContent = done ? C.decipher(c.ch, kc) : '';
    c.el.classList.toggle('is-done', done);
  });
  ui.rows.forEach(r => {
    r.el.textContent = r.cells.map(c => c.li < 0 ? c.ch : (c.out.textContent || '·')).join('') || ' ';
  });

  const n = work.done.size;
  if (!k) {
    ui.status.textContent = state.keys.length
      ? 'Drag a key from the tray into the slot, then drag across the tape.'
      : 'Your key tray is empty. Keys arrive as a signal of their own.';
  } else if (n >= ui.letters) {
    ui.status.textContent = 'Tape fully decoded under ' + keyName(work.key) + '.';
  } else {
    ui.status.textContent = n + ' of ' + ui.letters + ' letters decoded under ' +
      keyName(work.key) + '. Drag across the tape to decode more.';
  }
}

function renderKeys() {
  if (!ui) return;
  const work = workFor(state.sig);

  ui.slot.textContent = '';
  ui.slot.classList.toggle('has-key', !!work.key);
  if (work.key) {
    const t = token(work.key, 'span');
    ui.slot.appendChild(t);
    ui.slot.setAttribute('aria-label', 'Key slot holds ' + keyName(work.key) + '. Click to take it out.');
  } else {
    ui.slot.appendChild(h('span', 'slot__hint', 'Drop a key here'));
    ui.slot.setAttribute('aria-label', 'Key slot, empty');
  }

  ui.keypaper.textContent = '';
  if (work.key) {
    ui.keypaper.appendChild(h('h4', 'tools__sub', 'Clipped key telegram'));
    const page = D.store.pages.get(work.key);
    if (page) {
      const paper = h('div', 'slip');
      paper.innerHTML = page.html;
      ui.keypaper.appendChild(paper);
    } else {
      ui.keypaper.appendChild(h('p', 'tools__note',
        'That key telegram is still in the machine. Read it and it goes on the desk with this one.'));
    }
  }

  ui.tray.textContent = '';
  if (!state.keys.length) ui.tray.appendChild(h('span', 'tray__empty', 'No keys received'));
  state.keys.forEach(k => {
    const t = token(k);
    if (k === work.key) t.classList.add('is-in');
    t.setAttribute('aria-label', 'Put ' + keyName(k) + ' in the slot');
    t.addEventListener('click', () => setKey(k));
    t.addEventListener('pointerdown', e => tokenDown(e, k, t));
    t.addEventListener('pointermove', tokenMove);
    t.addEventListener('pointerup', tokenUp);
    t.addEventListener('pointercancel', endDrag);
    ui.tray.appendChild(t);
  });
}

function setKey(k) {
  if (!ui) return;
  D.clip(state.sig, k);                  // clips it on the desk too
  renderKeys();
  render();
}

/* ---------- carrying a key to the slot -------------------------- */

function tokenDown(e, k, t) {
  if (e.button !== 0) return;
  const r = t.getBoundingClientRect();
  drag = { k: k, t: t, x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, ghost: null };
  t.setPointerCapture(e.pointerId);
}

function overSlot(e) {
  const hit = document.elementFromPoint(e.clientX, e.clientY);
  return !!(hit && ui && hit.closest('.slot') === ui.slot);
}

function tokenMove(e) {
  if (!drag) return;
  if (!drag.ghost) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return;
    drag.ghost = drag.t.cloneNode(true);
    drag.ghost.classList.add('is-ghost');
    drag.ghost.style.width = drag.t.offsetWidth + 'px';
    document.body.appendChild(drag.ghost);
    drag.t.classList.add('is-lifted');
    ui.slot.classList.add('is-ready');
  }
  drag.ghost.style.transform =
    'translate(' + (e.clientX - drag.dx) + 'px,' + (e.clientY - drag.dy) + 'px) rotate(-3deg)';
  ui.slot.classList.toggle('is-over', overSlot(e));
}

function tokenUp(e) {
  if (!drag) return;
  if (drag.ghost) {
    swallowClick();
    const k = drag.k;
    const hit = overSlot(e);
    endDrag();
    if (hit) setKey(k);
  } else {
    drag = null;                           // a plain click; the click handler places it
  }
}

function endDrag() {
  if (!drag) return;
  if (drag.ghost) drag.ghost.remove();
  drag.t.classList.remove('is-lifted');
  if (ui) ui.slot.classList.remove('is-ready', 'is-over');
  drag = null;
}

/* ---------- dragging across the tape ---------------------------- */

function cellAt(e) {
  const hit = document.elementFromPoint(e.clientX, e.clientY);
  const cell = hit && hit.closest('.cell');
  return cell && ui.tape.contains(cell) ? ui.cells[+cell.dataset.n] : null;
}

function nudge() {
  ui.slot.classList.remove('is-nudge');
  void ui.slot.offsetWidth;                // restart the shake
  ui.slot.classList.add('is-nudge');
  ui.status.textContent = state.keys.length
    ? 'Put a key in the slot first.'
    : 'There is no key to decode with yet. Keys arrive as a signal of their own.';
}

function tapeDown(e) {
  if (e.button !== 0) return;
  const c = cellAt(e);
  if (!c) return;
  e.preventDefault();
  ui.tape.focus({ preventScroll: true });
  ui.cur = c.n;
  if (!keyword()) { nudge(); return; }
  ui.dragging = true;
  ui.range = { a: c.n, b: c.n };
  ui.tape.setPointerCapture(e.pointerId);
  paintRange();
}

function tapeMove(e) {
  if (!ui.dragging) return;
  const c = cellAt(e);
  if (!c || c.n === ui.range.b) return;
  ui.range.b = ui.cur = c.n;
  paintRange();
}

function tapeUp() {
  if (!ui.dragging) return;
  ui.dragging = false;
  swallowClick();
  decodeRange();
}

function tapeKey(e) {
  const last = ui.cells.length - 1;
  let to = null;
  if (e.key === 'ArrowRight') to = Math.min(ui.cur + 1, last);
  else if (e.key === 'ArrowLeft') to = Math.max(ui.cur - 1, 0);
  else if (e.key === 'Home') to = 0;
  else if (e.key === 'End') to = last;
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (!keyword()) { nudge(); return; }
    if (!ui.range) ui.range = { a: ui.cur, b: ui.cur };
    decodeRange();
    return;
  }
  if (to === null) return;
  e.preventDefault();
  if (e.shiftKey) ui.range = { a: ui.range ? ui.range.a : ui.cur, b: to };
  else ui.range = null;
  ui.cur = to;
  paintRange();
  ui.cells[to].el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function paintRange() {
  const r = ui.range;
  const lo = r ? Math.min(r.a, r.b) : -1;
  const hi = r ? Math.max(r.a, r.b) : -1;
  ui.cells.forEach(c => {
    c.el.classList.toggle('is-sel', c.n >= lo && c.n <= hi);
    c.el.classList.toggle('is-cur', c.n === ui.cur);
  });
}

function decodeRange() {
  const r = ui.range;
  if (!r) return;
  const work = workFor(state.sig);
  const lo = Math.min(r.a, r.b), hi = Math.max(r.a, r.b);
  for (let n = lo; n <= hi; n++) if (ui.cells[n].li >= 0) work.done.add(ui.cells[n].li);
  ui.range = null;
  paintRange();
  render();
  D.refresh();
}

/* ---------- the verdict ----------------------------------------- */

function verdict(sig) {
  const sec = h('section', 'tools__sec');
  sec.appendChild(h('h3', 'tools__head', 'Is this signal genuine?'));
  const v = state.verdicts.get(sig);
  if (v) {
    sec.appendChild(debrief(sig, v));
    return sec;
  }
  sec.appendChild(h('p', 'tools__text',
    'Check who it claims to be from, what it asks of you, and whether it reads under a key you trust.'));
  const row = h('div', 'verdict');
  const yes = h('button', 'vbtn vbtn--ok', 'Genuine — act on it');
  const no  = h('button', 'vbtn vbtn--bad', 'Suspect — report it');
  yes.type = no.type = 'button';
  yes.addEventListener('click', () => judge(sig, true, sec));
  no.addEventListener('click', () => judge(sig, false, sec));
  row.appendChild(yes);
  row.appendChild(no);
  sec.appendChild(row);
  return sec;
}

function judge(sig, saysGenuine, sec) {
  const genuine = T.truthy(sig.genuine);
  const v = { choice: saysGenuine, correct: saysGenuine === genuine };
  state.verdicts.set(sig, v);
  if (sig.key && !saysGenuine) state.suspect.add(sig);
  const next = verdict(sig);
  sec.replaceWith(next);
  renderKeys();
  D.refresh();
  const head = next.querySelector('.debrief__verdict');
  if (head) { head.tabIndex = -1; head.focus({ preventScroll: false }); }
  document.dispatchEvent(new CustomEvent('telexverdict', {
    detail: { signal: sig, genuine: genuine, choice: saysGenuine, correct: v.correct }
  }));
}

function cluesOf(sig) {
  return Object.keys(sig)
    .filter(k => /^clue(_\d+)?$/.test(k))
    .sort((a, b) => (+a.split('_')[1] || 0) - (+b.split('_')[1] || 0))
    .map(k => {
      const parts = String(sig[k]).split('|');
      return parts.length > 1
        ? { quote: parts[0].trim(), why: parts.slice(1).join('|').trim() }
        : { quote: '', why: parts[0].trim() };
    });
}

function debrief(sig, v) {
  const genuine = T.truthy(sig.genuine);
  const box = h('div', 'debrief ' + (v.correct ? 'is-right' : 'is-wrong'));
  box.appendChild(h('p', 'debrief__verdict',
    (v.correct ? 'Correct. ' : 'Not this time. ') +
    (genuine ? 'This signal is genuine.' : 'This signal is a forgery.')));

  const clues = cluesOf(sig);
  if (clues.length) {
    box.appendChild(h('h4', 'tools__sub', genuine ? 'Why it checks out' : 'Red flags'));
    const list = h('ul', 'clues');
    clues.forEach(c => {
      const li = h('li');
      if (c.quote) li.appendChild(h('span', 'clues__quote', c.quote));
      li.appendChild(h('span', 'clues__why', c.why));
      list.appendChild(li);
    });
    box.appendChild(list);
  }
  if (sig.lesson) box.appendChild(h('p', 'debrief__lesson', sig.lesson));

  const all = Array.from(state.verdicts.values());
  box.appendChild(h('p', 'debrief__tally',
    'Signals judged: ' + all.length + ' · correct: ' + all.filter(x => x.correct).length));
  return box;
}

/* ---------- wiring ---------------------------------------------- */

T.on('printend', () => renderKeys());   // a key may have come in while reading
T.on('open', show);
T.on('close', hide);

})();
