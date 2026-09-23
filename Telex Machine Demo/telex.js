/* ==================================================================
   TELEX — receiving teleprinter for the Dunkirk game
   ------------------------------------------------------------------
   The lamp flashes. The player presses Receive. The machine prints a
   slip of paper, too small to read. Clicking the slip enlarges it;
   the red X puts it back.

     · Settings live in  config.js
     · Signals live in   signals/*.js, listed in signals/manifest.js
     · Puzzle hooks hang off window.TELEX (API at the bottom)
   ================================================================== */

(function () {
'use strict';

/* Print speed, in characters a second. Fixed. A real Creed No. 7 ran
   at about 6.6, which is far more tense but turns a 400-character
   signal into a full minute of printing. */
const CPS = 40;

/* ---------- 1. SETTINGS ----------------------------------------- */

const CONFIG = Object.assign({
  ship:'M.Y. KESTREL', callsign:'GBKW', station:'V.A. DOVER (DYNAMO)',
  sign:'ACKNOWLEDGE BY LAMP ON SIGHT.',
  columns:38, keepSlips:12, noRepeat:true, alertDelay:0,
  hideOperatorPanel:false
}, window.TELEX_CONFIG || {});

const SIGNAL_DIR = 'signals/';

/* ---------- 2. ELEMENTS AND STATE ------------------------------- */

const el = {
  bay:      document.getElementById('bay'),
  idlenote: document.getElementById('idlenote'),
  platen:   document.getElementById('platen'),
  lamp:     document.getElementById('lampwrap'),
  receive:  document.getElementById('receive'),
  viewer:   document.getElementById('viewer'),
  viewpaper:document.getElementById('viewerpaper'),
  closeview:document.getElementById('closeview'),
  gm:       document.getElementById('gm'),
  gmbody:   document.getElementById('gmbody')
};

const state = {
  signals:   [],     // every signal file that loaded, in manifest order
  failed:    [],     // filenames that didn't load
  queue:     [],     // specific signals asked for, ahead of the random pick
  alerted:   false,  // lamp is flashing
  printing:  false,
  lastId:    null,   // so the random pick doesn't repeat itself
  returnTo:  null,   // slip to refocus when the viewer closes
  listeners: {}
};

/* ---------- 3. READING A SIGNAL FILE ---------------------------- */
/*
   A signal file is a header block, a --- rule, then the message.

     SERIAL:   NR 014
     PRIORITY: IMMEDIATE
     TIME:     2212Z/29 MAY 40
     ---
     Orders for Operation Dynamo. Proceed from Ramsgate...

   Every header is optional. Any header the machine doesn't recognise
   is still kept on the signal object under a lower_snake_case key, so
   you can carry puzzle data alongside the prose — ANSWER: 128 arrives
   as sig.answer, and never appears on the paper.
*/

function parseSignal(text) {
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  const sig = {};
  const body = [];
  let inHeader = true;
  let i = 0;

  while (i < lines.length && !lines[i].trim()) i++;      // leading blanks

  for (; i < lines.length; i++) {
    const line = lines[i];
    if (inHeader) {
      if (/^-{3,}\s*$/.test(line.trim())) { inHeader = false; continue; }
      const m = line.match(/^([A-Za-z][A-Za-z0-9 _-]*):[ \t]*(.*)$/);
      if (m) {
        sig[m[1].trim().toLowerCase().replace(/[ -]+/g, '_')] = m[2].trim();
        continue;
      }
      if (!line.trim()) continue;
      inHeader = false;                 // no rule given; the body starts here
    }
    body.push(line);
  }

  sig.body = body.join('\n').trim();
  return sig;
}

/* ---------- 4. SETTING IT IN TYPE ------------------------------- */

function wrap(text, width) {
  const out = [];
  text.split(/\n{2,}/).forEach((para, n) => {
    if (n) out.push('');
    let line = '';
    para.replace(/\s+/g, ' ').trim().split(' ').forEach(word => {
      if (!line.length) { line = word; return; }
      if ((line + ' ' + word).length <= width) line += ' ' + word;
      else { out.push(line); line = word; }
    });
    if (line.length) out.push(line);
  });
  return out;
}

/* Header values arrive as strings, so "no" must not read as yes. */
function truthy(v) {
  if (typeof v === 'string') return !/^(no|false|off|0|)$/i.test(v.trim());
  return !!v;
}

function compose(sig) {
  const w = CONFIG.columns;
  const bar = '='.repeat(w);
  const head = [
    ('ZCZC ' + CONFIG.callsign + ' ' + (sig.serial || '')).trim(),
    'FM  ' + (sig.from || CONFIG.station),
    'TO  ' + (sig.to || CONFIG.ship),
    'PRI ' + (sig.priority || 'ROUTINE')
  ];
  if (sig.time) head.push('TOO ' + sig.time);
  head.push(bar);

  const foot = [bar];
  const sign = sig.sign !== undefined ? sig.sign : CONFIG.sign;
  if (sign) foot.push(sign);
  foot.push('NNNN');

  const out = head.concat(wrap(sig.body || '', w)).concat(foot).join('\n');
  return truthy(sig.raw) ? out : out.toUpperCase();
}

/* ---------- 5. THE PRINTER -------------------------------------- */

function strikeChar(into, char) {
  if (char === '\n') { into.appendChild(document.createTextNode('\n')); return; }
  const s = document.createElement('span');
  s.className = 'ch';
  s.textContent = char;
  /* Worn typebars: every letter lands a hair off true and inks
     unevenly. In em, so the drift holds up when the slip enlarges. */
  const dy = (Math.random() - 0.5) * 0.14;
  const dx = (Math.random() - 0.5) * 0.09;
  s.style.transform = 'translate(' + dx.toFixed(3) + 'em, ' + dy.toFixed(3) + 'em)';
  s.style.opacity = (0.8 + Math.random() * 0.2).toFixed(2);
  if (Math.random() < 0.05) s.style.fontWeight = '700';
  into.appendChild(s);
}

function trimBay() {
  const slips = el.bay.querySelectorAll('.slip');
  for (let i = 0; i < slips.length - CONFIG.keepSlips; i++) slips[i].remove();
}

function printSlip(sig) {
  return new Promise(resolve => {
    state.printing = true;
    if (el.idlenote.parentNode) el.idlenote.remove();
    el.platen.classList.add('rolling');
    emit('printstart', sig);

    const slip = document.createElement('button');
    slip.type = 'button';
    slip.className = 'slip printing';
    slip.disabled = true;
    slip.setAttribute('aria-label', 'Signal ' + (sig.serial || '') + ' — click to read');
    slip._signal = sig;
    el.bay.appendChild(slip);
    trimBay();

    const caret = document.createElement('span');
    caret.className = 'caret';
    slip.appendChild(caret);

    const text = compose(sig);
    let i = 0, last = 0, acc = 0;

    const tick = now => {
      if (!last) last = now;
      acc += (now - last) / (1000 / CPS);
      last = now;
      let due = Math.floor(acc);
      if (due > 0) {
        acc -= due;
        due = Math.min(due, 16);            // don't burst after a tab switch
        const frag = document.createDocumentFragment();
        for (let k = 0; k < due && i < text.length; k++) strikeChar(frag, text[i++]);
        slip.insertBefore(frag, caret);
        el.bay.scrollTop = el.bay.scrollHeight;
      }
      if (i < text.length) {
        requestAnimationFrame(tick);
      } else {
        caret.remove();
        slip.classList.remove('printing');
        slip.disabled = false;
        el.platen.classList.remove('rolling');
        el.bay.scrollTop = el.bay.scrollHeight;
        state.printing = false;
        refresh();
        emit('printend', sig);
        resolve(sig);
      }
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- 6. MACHINE STATE ------------------------------------ */

function refresh() {
  const waiting = (state.alerted || state.queue.length > 0) && !state.printing;
  el.lamp.classList.toggle('live', waiting);
  el.receive.classList.toggle('armed', waiting);
  el.receive.disabled = !waiting;
}

/* Light the lamp with no particular signal attached. Pressing Receive
   then prints one at random. */
function incoming() {
  setTimeout(() => {
    state.alerted = true;
    refresh();
    emit('alert', null);
  }, CONFIG.alertDelay);
}

/* Light the lamp for one specific signal, jumping the random pick. */
function send(sig) {
  if (typeof sig === 'string') sig = parseSignal(sig);
  if (!sig) return;
  state.queue.push(sig);
  setTimeout(() => { refresh(); emit('alert', sig); }, CONFIG.alertDelay);
  return sig;
}

function pickRandom() {
  const pool = state.signals;
  if (!pool.length) return null;
  if (pool.length === 1) return pool[0];
  let sig, guard = 0;
  do {
    sig = pool[Math.floor(Math.random() * pool.length)];
    guard++;
  } while (CONFIG.noRepeat && sig.id === state.lastId && guard < 25);
  return sig;
}

async function receive() {
  if (state.printing) return;
  const sig = state.queue.shift() || pickRandom() ||
    fault('NO SIGNAL FILES LOADED.',
          'ADD ONE TO signals/manifest.js AND RELOAD.');
  state.alerted = false;
  state.lastId = sig.id || null;
  refresh();
  el.receive.disabled = true;
  el.receive.classList.remove('armed');
  el.lamp.classList.remove('live');
  await printSlip(sig);
  return sig;
}

function tear() {
  if (state.printing) return;
  const slips = el.bay.querySelectorAll('.slip');
  if (!slips.length) return;
  slips.forEach(s => s.remove());
  el.bay.appendChild(el.idlenote);
  setIdleNote();
  emit('tear');
}

function emit(name, payload) {
  (state.listeners[name] || []).forEach(fn => {
    try { fn(payload); } catch (e) { console.error('[telex]', e); }
  });
}

/* ---------- 7. THE ENLARGED SHEET ------------------------------- */

function openSlip(slip) {
  if (!slip || slip.classList.contains('printing')) return;
  el.viewpaper.textContent = '';
  /* A plain div, not a clone of the button — nothing inside the
     viewer should be clickable except the red X. */
  const big = document.createElement('div');
  big.className = 'slip';
  big.innerHTML = slip.innerHTML;
  el.viewpaper.appendChild(big);
  el.viewer.classList.add('open');
  state.returnTo = slip;
  el.closeview.focus();
  emit('open', slip._signal || null);
}

function closeSlip() {
  if (!el.viewer.classList.contains('open')) return;
  el.viewer.classList.remove('open');
  el.viewpaper.textContent = '';
  if (state.returnTo && state.returnTo.isConnected) state.returnTo.focus();
  state.returnTo = null;
  emit('close');
}

/* ---------- 8. LOADING SIGNAL FILES ----------------------------- */

let incomingName = null;      // the file currently being evaluated

/* Called by each signal file as it loads. */
function register(text) {
  const sig = parseSignal(text);
  if (!sig.id) sig.id = (incomingName || 'signal-' + state.signals.length).replace(/\.js$/, '');
  sig.file = incomingName;
  state.signals.push(sig);
  return sig;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve(src);
    s.onerror = () => reject(new Error(src));
    document.head.appendChild(s);
  });
}

/* Load the files the manifest names, in order, then wake the panel. */
async function load(names, base) {
  base = base === undefined ? SIGNAL_DIR : base;
  for (const name of names) {
    incomingName = name;
    try { await loadScript(base + name); }
    catch (e) { state.failed.push(name); console.error('[telex] could not load ' + base + name); }
    incomingName = null;
  }
  buildPanel();
  setIdleNote();
  return state.signals;
}

/* Load one extra file on demand and queue it — for signals you only
   want to exist once the players have earned them. */
async function sendFile(name, base) {
  base = base === undefined ? SIGNAL_DIR : base;
  const before = state.signals.length;
  incomingName = name;
  try {
    await loadScript(base + name);
  } catch (e) {
    incomingName = null;
    return send(fault('SIGNAL FILE NOT FOUND: ' + base + name,
                      'CHECK THE NAME AGAINST THE FILE ON DISK.'));
  }
  incomingName = null;
  const sig = state.signals[before];
  buildPanel();
  return sig ? send(sig) : undefined;
}

/* A signal from the machine itself, for when something is wrong. */
function fault(/* ...lines */) {
  return {
    serial: '',
    from: 'TELEPRINTER',
    to: CONFIG.ship,
    priority: 'FAULT',
    sign: '',
    raw: true,                          // keep file paths in their real case
    body: Array.prototype.slice.call(arguments).join('\n\n')
  };
}

/* ---------- 9. IDLE AND EMPTY STATES ---------------------------- */

function setIdleNote() {
  if (!el.idlenote.parentNode) return;
  if (state.signals.length) { el.idlenote.textContent = 'No traffic'; return; }
  el.idlenote.innerHTML = state.failed.length
    ? 'No signals loaded.<br>Check the names in<br><code>signals/manifest.js</code>'
    : 'No signals listed.<br>Add a file to<br><code>signals/manifest.js</code>';
}

/* ---------- 10. WIRING ------------------------------------------ */

el.receive.addEventListener('click', receive);
el.platen.addEventListener('click', tear);

/* One listener on the bay rather than one per slip, so slips printed
   later are covered without rewiring. */
el.bay.addEventListener('click', e => {
  const slip = e.target.closest ? e.target.closest('.slip') : null;
  if (slip) openSlip(slip);
});

el.closeview.addEventListener('click', closeSlip);
el.viewer.addEventListener('click', e => { if (e.target === el.viewer) closeSlip(); });

/* Escape closes the sheet. No other global keys are bound, so nothing
   here will fight the ship's steering controls. */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && el.viewer.classList.contains('open')) {
    e.preventDefault();
    closeSlip();
  }
});

/* ---------- 11. OPERATOR PANEL ---------------------------------- */
/* Game-master side. Delete the <details class="gm"> block in
   index.html for the live install, or set hideOperatorPanel. */

function buildPanel() {
  if (!el.gm) return;
  if (CONFIG.hideOperatorPanel) { el.gm.hidden = true; return; }
  el.gmbody.textContent = '';

  const lead = document.createElement('button');
  lead.className = 'sig lead';
  lead.textContent = 'Incoming signal — flash the lamp';
  lead.title = 'Receive then prints one of the signal files at random';
  lead.addEventListener('click', incoming);
  el.gmbody.appendChild(lead);

  state.signals.forEach((sig, n) => {
    const b = document.createElement('button');
    b.className = 'sig';
    b.innerHTML = '<b>' + (n + 1) + '</b> &nbsp;' + (sig.serial || sig.id);
    b.title = 'Force this one: ' + (sig.file || sig.id);
    b.addEventListener('click', () => send(sig));
    el.gmbody.appendChild(b);
  });

  state.failed.forEach(name => {
    const b = document.createElement('button');
    b.className = 'sig bad';
    b.textContent = name + ' — not found';
    b.addEventListener('click', () => {
      send(fault('SIGNAL FILE NOT FOUND: ' + SIGNAL_DIR + name,
                 'THE MANIFEST NAMES A FILE THAT IS NOT ON DISK.',
                 'CHECK THE SPELLING IN signals/manifest.js.'));
    });
    el.gmbody.appendChild(b);
  });

  if (!state.signals.length && !state.failed.length) {
    const p = document.createElement('span');
    p.className = 'note';
    p.textContent = 'No signal files listed in signals/manifest.js';
    el.gmbody.appendChild(p);
  }

  el.gmbody.appendChild(document.createElement('hr'));

  const clr = document.createElement('button');
  clr.className = 'sig';
  clr.textContent = 'Clear the bay';
  clr.addEventListener('click', tear);
  el.gmbody.appendChild(clr);
}

/* ---------- 12. PUBLIC API -------------------------------------- */
/*
   TELEX.incoming()          flash the lamp. Pressing Receive then
                             prints one of the loaded signals at
                             random. This is the ordinary case.
   TELEX.send(sigOrText)     flash the lamp for one specific signal,
                             jumping ahead of the random pick. Takes a
                             signal object or raw signal text.
   TELEX.sendId('02-route-x')
   TELEX.sendFile('06-recall.js')
                             load an extra file from signals/ and queue
                             it. For signals the players earn.
   TELEX.receive()           print now, without waiting for a click.
   TELEX.tear()              clear the bay.
   TELEX.open(slipOrIndex)   enlarge a slip from code.
   TELEX.close()             put the enlarged sheet back.
   TELEX.get(id)             a loaded signal, headers and all.
   TELEX.signals             every loaded signal, in manifest order.
   TELEX.waiting()           is the lamp flashing?
   TELEX.isPrinting()
   TELEX.on(event, fn)       'alert' | 'printstart' | 'printend'
                             | 'open' | 'close' | 'tear'

   Custom headers survive parsing, so a file carrying  ANSWER: 128
   reaches your puzzle code as sig.answer.
*/

window.TELEX = {
  signal:   register,                      // called by the signal files
  load:     load,                          // called by the manifest
  incoming: incoming,
  send:     send,
  sendId:   id => { const s = state.signals.find(x => x.id === id); return s ? send(s) : undefined; },
  sendFile: sendFile,
  receive:  receive,
  tear:     tear,
  open:     ref => openSlip(typeof ref === 'number'
              ? el.bay.querySelectorAll('.slip')[ref] : ref),
  close:    closeSlip,
  get:      id => state.signals.find(x => x.id === id),
  parse:    parseSignal,
  slips:    () => Array.prototype.slice.call(el.bay.querySelectorAll('.slip')),
  waiting:  () => state.alerted || state.queue.length > 0,
  isPrinting: () => state.printing,
  on:       (name, fn) => { (state.listeners[name] = state.listeners[name] || []).push(fn); },
  config:   CONFIG,
  cps:      CPS
};

Object.defineProperty(window.TELEX, 'signals', { get: () => state.signals });

/* If the manifest never runs — misspelled path, file missing — say so
   rather than sitting there looking broken. */
setTimeout(() => {
  if (!state.signals.length && !state.failed.length) { buildPanel(); setIdleNote(); }
}, 1200);

refresh();
buildPanel();

})();
