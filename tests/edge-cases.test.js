/* ==================================================================
   DUNKIRK — edge-case unit tests
   ------------------------------------------------------------------
   Run from the repo root (Node 18+, nothing to install):

     node --test tests/

   The game is plain browser JavaScript, so these tests load the real
   source files into a sandbox instead of copying the code:

     Script/clock.js, Script/voyage.js   run whole, with a FAKE ship
     Telex Machine Demo/course.js        (window.SHIP) and a MOCK
                                         dialogue that records every
                                         event the voyage says. The
                                         fake ship fills in courses
                                         from course.js as it prints,
                                         as the real one does.
     Telex Machine Demo/telex.js,        the pure helpers (parseSignal,
     Telex Machine Demo/decoder.js       wrap, truthy, the cipher,
                                         cluesOf) are lifted out by
                                         name, so no DOM is needed.

   Expected values come from the READMEs and the voyage settings in
   Script/dialogue.js, not from reading the code. Each block says what
   partition or boundary it is checking.
   ================================================================== */

'use strict';

const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('node:fs');
const path   = require('node:path');
const vm     = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* ---------- loading the browser code ---------------------------- */

// The text of `function name(...) { ... }`, by counting braces.
function extract(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function ' + name + ' not found');
  let i = src.indexOf('{', start), depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) break;
  }
  return src.slice(start, i + 1);
}

// The telex and cipher-desk helpers, with no DOM behind them
function loadTelexHelpers() {
  const telex   = read('Telex Machine Demo/telex.js');
  const decoder = read('Telex Machine Demo/decoder.js');
  const names   = ['parseSignal', 'wrap', 'truthy', 'letters', 'vigenere', 'isEnciphered', 'bodyText'];
  const code = names.map(n => extract(telex, n)).join('\n') + '\n' + extract(decoder, 'cluesOf') +
    '\n({ ' + names.join(', ') + ', cluesOf })';
  return vm.runInNewContext(code, {});
}

// A stand-in for window.SHIP: just enough for voyage.js
function fakeShip() {
  return {
    heading: 0, reading: false, slipWaiting: false,
    position: { x: 0, y: 0 },
    start: { x: 0, y: 0 },          // (0, 0) on the position indicator
    glasses: false,                 // is the mark in the binoculars' view?
    aircraftFlies: true,
    marks: [],
    sendSignal(text) { return { text }; },          // the "signal" events will name; see loadStory
    sendAircraft() { return this.aircraftFlies; },
    addMark(m) { this.marks.push(m); return this.marks.length; },
    removeMark() {},
    inGlasses() { return this.glasses; }
  };
}

// Script/clock.js and Script/voyage.js in a sandbox with a fake ship
function loadStory() {
  const ship = fakeShip();
  const ctx = {
    document: new EventTarget(),
    CustomEvent,
    SHIP: ship,
    now: 1e6,                                       // performance.now(), set by tests
    console
  };
  ctx.performance = { now: () => ctx.now };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['Script/clock.js', 'Script/voyage.js', 'Telex Machine Demo/course.js']) {
    vm.runInContext(read(f), ctx, { filename: f });
  }
  // Like the ship page: parse the text, and fill in its course from where she is
  ship.sendSignal = text => {
    const sig = T.parseSignal(text);
    sig.text = text;
    ctx.TELEX_COURSE.stamp(sig, { x: ship.position.x, y: ship.position.y, heading: ship.heading });
    return sig;
  };
  return ctx;
}

const T = loadTelexHelpers();
const { Story, TELEX_COURSE } = loadStory();
const { Clock } = Story;
const arc = Story.Voyage.arc;

/* The voyage settings, as written in Script/dialogue.js */
const CFG = {
  start: '05:00', length: 780, date: '30 MAY 40', tolerance: 20,
  numbering: { lastSerial: 34, lastTime: '05:15', ago: 5 },
  goalNear: 700, sightingGrace: 20, sightingRange: 1500,
  followAfter: 5, refuseAfter: 20, trustAfter: 3, luredAfter: 30,
  offCourseWarn: 15, offCourseUrgent: 40, newCourseGrace: 20,
  unreadWarn: 20, telexGap: 3
};

// A whole voyage: real clock, real Voyage, fake ship, mock dialogue
function voyage(lines, cfg = {}) {
  const ctx = loadStory();
  const ship = ctx.SHIP;
  const clock = new ctx.Story.Clock(CFG.start, CFG.length);
  clock.start();
  const said = [];
  const dialogue = { trigger: e => said.push(e), enqueueTimed() {} };
  const h = { ship, clock, said, ctx, ending: null };
  h.v = new ctx.Story.Voyage({ voyage: { ...CFG, ...cfg }, lines }, {
    clock, dialogue, onEnd: (kind, score) => { h.ending = { kind, score }; }
  });
  h.rec  = id => h.v.telexes.find(r => r.id === id);
  h.emit = (name, detail) => ctx.document.dispatchEvent(new CustomEvent(name, { detail }));
  h.read = id => h.emit('signalread', { signal: h.rec(id).sig });
  h.verdict = (id, choice) => h.emit('telexverdict', { signal: h.rec(id).sig, choice });
  // Run the game for `secs` voyage seconds, in frames of dt
  h.run = (secs, dt = 1) => {
    for (let n = Math.round(secs / dt); n > 0; n--) { clock.tick(dt); h.v.update(dt); }
  };
  return h;
}

const telex = (id, at, extra) =>
  ({ id, mode: 'TELEX', trigger: { type: 'time', value: at }, text: 'TEST ' + id, ...extra });
const trueCourse  = (id, at, heading) => telex(id, at, { correctAction: 'trust', newHeading: heading });
const trueNotice  = (id, at)          => telex(id, at, { correctAction: 'trust' });
const falseCourse = (id, at, heading, extra) =>
  telex(id, at, { correctAction: 'reject', lureHeading: heading, ...extra });

/* =================================================================
   1. THE CLOCK  (Script/clock.js)
   ================================================================= */

test('Clock.format: start, deadline, and the minute boundary', () => {
  const c = new Clock('05:00', 780);
  assert.equal(c.format(0), '05:00');        // departure
  assert.equal(c.format(780), '18:00');      // the deadline
  assert.equal(c.format(59.9), '05:59');     // just under a minute: rounds down
  assert.equal(c.format(60), '06:00');       // exactly a minute
  assert.equal(c.format(55), '05:55');
  assert.equal(c.format(5), '05:05');        // single-digit minutes get a zero
});

test('Clock.format: past midnight wraps to 00:00', () => {
  const c = new Clock('05:00', 780);
  assert.equal(c.format(19 * 60), '00:00');
  assert.equal(c.format(20 * 60), '01:00');
  assert.equal(new Clock('23:59').format(1), '00:00');
});

test('Clock.parse: good times', () => {
  assert.equal(Clock.parse('T+0:00'), 0);
  assert.equal(Clock.parse('T+0:01'), 1);
  assert.equal(Clock.parse('T+0:59'), 59);
  assert.equal(Clock.parse('T+1:00'), 60);
  assert.equal(Clock.parse('T+3:15'), 195);
  assert.equal(Clock.parse('T+13:00'), 780);   // the deadline
});

test('Clock.parse: badly written times are refused', () => {
  for (const bad of ['', '3:15', 'T+3:5', 'T-1:00', 'T+:15', 'T+3.15', undefined, null]) {
    assert.throws(() => Clock.parse(bad), /bad time/, 'should refuse ' + JSON.stringify(bad));
  }
});

test('Clock.parse: seconds must be 00-59 and nothing may trail', () => {
  // A writer's typo should be caught, not quietly read as some other time
  assert.throws(() => Clock.parse('T+3:60'), /bad time/);
  assert.throws(() => Clock.parse('T+3:150'), /bad time/);   // not T+3:15
});

test('Clock.label: rounds down and pads seconds; parse(label(t)) === t', () => {
  assert.equal(Clock.label(0), 'T+0:00');
  assert.equal(Clock.label(59.9), 'T+0:59');
  assert.equal(Clock.label(60), 'T+1:00');
  assert.equal(Clock.label(780), 'T+13:00');
  for (const t of [0, 1, 9, 10, 59, 60, 61, 195, 779, 780]) assert.equal(Clock.parse(Clock.label(t)), t);
});

test('Clock.tick: paused clock does not move', () => {
  const c = new Clock('05:00', 780);
  assert.equal(c.tick(1), 0);
  assert.equal(c.t, 0);
  c.start(); c.tick(1); c.pause();
  assert.equal(c.tick(5), 0);
  assert.equal(c.t, 1);
});

test('Clock.tick: speed-up, and it stops exactly at the deadline', () => {
  const c = new Clock('05:00', 780);
  c.start();
  c.speed = 5;
  assert.equal(c.tick(1), 5);
  c.speed = 1;
  c.jump(779.5);
  assert.equal(c.finished, false);
  assert.equal(c.tick(1), 0.5);      // only half a second was left
  assert.equal(c.t, 780);
  assert.equal(c.finished, true);
  assert.equal(c.tick(1), 0);        // nothing after the end
});

test('Clock.tick: a zero or negative frame never runs the clock backwards', () => {
  const c = new Clock('05:00', 780);
  c.start();
  c.jump(100);
  assert.equal(c.tick(0), 0);
  c.tick(-1);
  assert.ok(c.t >= 100, 'clock went back to ' + c.t);
});

test('Clock.jump: clamped to the voyage', () => {
  const c = new Clock('05:00', 780);
  c.jump(-10);   assert.equal(c.t, 0);
  c.jump(10000); assert.equal(c.t, 780); assert.equal(c.finished, true);
  c.jump(779);   assert.equal(c.finished, false);
});

/* =================================================================
   2. COURSE ANGLES  (Story.Voyage.arc)
   ================================================================= */

test('arc: shortest signed turn, across north', () => {
  assert.equal(arc(72, 72), 0);
  assert.equal(arc(350, 10), 20);       // through north, not the long way
  assert.equal(arc(10, 350), -20);
  assert.equal(arc(0, 360), 0);         // 360 is north
  assert.equal(arc(720, 5), 5);         // more than one turn
  assert.equal(arc(0, -1000), 80);      // big negatives
  assert.equal(Math.abs(arc(0, 180)), 180);   // dead astern: either way is 180
  assert.equal(arc(0, 180.5), -179.5);
});

test('on course: exactly ±20° counts, a hair beyond does not', () => {
  const cases = [
    [72, 92, true], [72, 52, true],          // on each edge
    [72, 92.5, false], [72, 51.5, false],    // just past each edge
    [15, 355, true], [15, 354.5, false],     // the edge across north
    [15, 35, true]
  ];
  for (const [order, heading, on] of cases) {
    const h = voyage([trueCourse('TX-01', 'T+0:00', order)]);
    h.run(1);
    h.read('TX-01');
    h.ship.heading = heading;
    h.run(3);
    assert.equal(h.rec('TX-01').judged === 'trust', on, 'order ' + order + ', heading ' + heading);
  }
});

/* =================================================================
   3. TELEX HEADERS  (telex.js: truthy, parseSignal)
   ================================================================= */

test('truthy: header words that mean no', () => {
  for (const v of ['no', 'No', 'NO', 'false', 'FALSE', 'off', '0', '', '  no  ', '   ', undefined, null, 0, false]) {
    assert.equal(T.truthy(v), false, JSON.stringify(v));
  }
});

test('truthy: header words that mean yes', () => {
  for (const v of ['yes', 'YES', 'true', 'on', '1', 'VIGENERE', true, 1]) {
    assert.equal(T.truthy(v), true, JSON.stringify(v));
  }
});

test('parseSignal: headers, rule, and body', () => {
  const s = T.parseSignal('SERIAL: NR 036\nPRIORITY: IMMEDIATE\n---\nSteer 072.\n');
  assert.equal(s.serial, 'NR 036');
  assert.equal(s.priority, 'IMMEDIATE');
  assert.equal(s.body, 'Steer 072.');
});

test('parseSignal: Windows line endings', () => {
  const s = T.parseSignal('SERIAL: NR 036\r\nTIME: 0412Z/30 MAY 40\r\n---\r\nSteer 072.\r\n');
  assert.equal(s.serial, 'NR 036');
  assert.equal(s.time, '0412Z/30 MAY 40');
  assert.equal(s.body, 'Steer 072.');
});

test('parseSignal: odd header names become lower_snake_case', () => {
  const s = T.parseSignal('CLUE 1: a | b\nKEY-NAME: DAY KEY\nGenuine: no\n---\nx');
  assert.equal(s.clue_1, 'a | b');
  assert.equal(s.key_name, 'DAY KEY');
  assert.equal(s.genuine, 'no');
});

test('parseSignal: empty values, colons inside values, repeats', () => {
  const s = T.parseSignal('GENUINE:\nTIME: 04:12\nSERIAL: NR 1\nSERIAL: NR 2\n---\nx');
  assert.equal(s.genuine, '');            // present but empty
  assert.equal(s.time, '04:12');          // only the first colon splits
  assert.equal(s.serial, 'NR 2');         // the last one wins
});

test('parseSignal: no rule, the body starts at the first plain line', () => {
  const s = T.parseSignal('SERIAL: NR 036\n\nProceed to sea.');
  assert.equal(s.serial, 'NR 036');
  assert.equal(s.body, 'Proceed to sea.');
});

test('parseSignal: after the rule, "Word: text" stays in the body', () => {
  const s = T.parseSignal('SERIAL: NR 036\n---\nNote: steer 072.\nFROM: nobody');
  assert.equal(s.body, 'Note: steer 072.\nFROM: nobody');
  assert.equal(s.note, undefined);
  assert.equal(s.from, undefined);
});

test('parseSignal: blank, header-only and long-rule signals', () => {
  assert.equal(T.parseSignal('').body, '');
  assert.equal(T.parseSignal('\n\n\n').body, '');
  assert.equal(T.parseSignal('SERIAL: NR 1\n---').body, '');
  assert.equal(T.parseSignal('\n\nSERIAL: NR 1\n-------\nbody').serial, 'NR 1');
  assert.equal(T.parseSignal('SERIAL: NR 1\n--\nbody').body, '--\nbody');   // two dashes is not a rule
});

/* =================================================================
   4. THE CIPHER  (telex.js: letters, vigenere, isEnciphered, bodyText)
   ================================================================= */

test('letters: keeps A-Z only, upper case', () => {
  assert.equal(T.letters('dyn amo'), 'DYNAMO');
  assert.equal(T.letters('D1Y2N-A.M O'), 'DYNAMO');
  assert.equal(T.letters(''), '');
  assert.equal(T.letters(null), '');
  assert.equal(T.letters(undefined), '');
  assert.equal(T.letters(12345), '');
  assert.equal(T.letters('Été'), 'T');            // accented letters are not A-Z
});

test('vigenere: the textbook example', () => {
  assert.equal(T.vigenere('ATTACKATDAWN', 'LEMON', 1), 'LXFOPVEFRNHR');
  assert.equal(T.vigenere('LXFOPVEFRNHR', 'LEMON', -1), 'ATTACKATDAWN');
});

test('vigenere: spaces and figures pass through and do not use up the key', () => {
  assert.equal(T.vigenere('ATTACK AT DAWN', 'LEMON', 1), 'LXFOPV EF RNHR');
  assert.equal(T.vigenere('STEER 040.', 'A', 1), 'STEER 040.');
  assert.equal(T.vigenere('040 / 15', 'DYNAMO', 1), '040 / 15');
});

test('vigenere: wraps past Z and before A', () => {
  assert.equal(T.vigenere('Z', 'B', 1), 'A');
  assert.equal(T.vigenere('A', 'B', -1), 'Z');
  assert.equal(T.vigenere('Z', 'Z', 1), 'Y');
});

test('vigenere: no usable key leaves the text alone', () => {
  assert.equal(T.vigenere('HELLO', '', 1), 'HELLO');
  assert.equal(T.vigenere('HELLO', '123', 1), 'HELLO');
  assert.equal(T.vigenere('HELLO', undefined, 1), 'HELLO');
  assert.equal(T.vigenere('HELLO', 'A', 1), 'HELLO');      // A shifts by zero
});

test('vigenere: key spacing and case do not matter', () => {
  const want = T.vigenere('ATTACK AT DAWN', 'LEMON', 1);
  assert.equal(T.vigenere('ATTACK AT DAWN', 'lemon', 1), want);
  assert.equal(T.vigenere('ATTACK AT DAWN', 'LE-MON', 1), want);
});

test('vigenere: a key longer than the message', () => {
  assert.equal(T.vigenere('AB', 'BCDEFG', 1), 'BD');
});

test('cipher: the day key round-trips; the forged key does not', () => {
  const plain = 'STEER ZERO FOUR ZERO FOR DUNKIRK. NR 045.';
  const sent  = T.vigenere(plain, 'DYNAMO', 1);
  assert.notEqual(sent, plain);
  assert.equal(T.vigenere(sent, 'DYNAMO', -1), plain);
  assert.notEqual(T.vigenere(sent, 'SEAGULL', -1), plain);
});

test('isEnciphered: needs both a CIPHER that means yes and a real keyword', () => {
  assert.equal(T.isEnciphered({ cipher: 'VIGENERE', keyword: 'DYNAMO' }), true);
  assert.equal(T.isEnciphered({ cipher: 'no', keyword: 'DYNAMO' }), false);
  assert.equal(T.isEnciphered({ cipher: 'VIGENERE', keyword: '' }), false);
  assert.equal(T.isEnciphered({ cipher: 'VIGENERE', keyword: '123' }), false);
  assert.equal(T.isEnciphered({ cipher: 'VIGENERE' }), false);
  assert.equal(T.isEnciphered({ keyword: 'DYNAMO' }), false);
});

test('bodyText: key signals get a key group; enciphered bodies are enciphered', () => {
  assert.equal(T.bodyText({ body: 'Day key follows.', key: 'dyn amo' }), 'Day key follows.\n\nKEY GROUP DYNAMO');
  assert.equal(T.bodyText({ body: 'attack at dawn', cipher: 'yes', keyword: 'LEMON' }), 'LXFOPV EF RNHR');
  assert.equal(T.bodyText({}), '');
});

/* =================================================================
   5. WRAPPING THE SLIP  (telex.js: wrap)
   ================================================================= */

test('wrap: a line exactly the width fits; one more character breaks', () => {
  assert.deepEqual([...T.wrap('aaaa bbbbb', 10)], ['aaaa bbbbb']);       // 10 chars
  assert.deepEqual([...T.wrap('aaaa bbbbbb', 10)], ['aaaa', 'bbbbbb']);  // 11 chars
});

test('wrap: a word longer than the slip is kept whole, not lost', () => {
  assert.deepEqual([...T.wrap('a ABCDEFGHIJKLMNOP b', 10)], ['a', 'ABCDEFGHIJKLMNOP', 'b']);
});

test('wrap: empty text, single newlines, paragraph breaks', () => {
  assert.deepEqual([...T.wrap('', 38)], []);
  assert.deepEqual([...T.wrap('a\nb', 38)], ['a b']);               // one newline is just a space
  assert.deepEqual([...T.wrap('a\n\nb', 38)], ['a', '', 'b']);      // a blank line between paragraphs
  assert.deepEqual([...T.wrap('a\n\n\n\nb', 38)], ['a', '', 'b']);  // only one, however many
  assert.deepEqual([...T.wrap('a    b', 38)], ['a b']);             // runs of spaces collapse
});

/* =================================================================
   6. DEBRIEF CLUES  (decoder.js: cluesOf)
   ================================================================= */

test('cluesOf: CLUE, CLUE 1, CLUE 2, CLUE 10 come out in number order', () => {
  const clues = T.cluesOf({ clue_10: 'ten', clue_2: 'two', clue: 'bare', clue_1: 'one', lesson: 'x' });
  assert.deepEqual([...clues].map(c => c.why), ['bare', 'one', 'two', 'ten']);
});

test('cluesOf: "quote | why", why alone, and extra pipes', () => {
  const [a, b, c] = T.cluesOf({ clue_1: ' V.A. DOVRE | wrong sender ', clue_2: 'no number', clue_3: 'a | b | c' });
  assert.deepEqual({ ...a }, { quote: 'V.A. DOVRE', why: 'wrong sender' });
  assert.deepEqual({ ...b }, { quote: '', why: 'no number' });
  assert.deepEqual({ ...c }, { quote: 'a', why: 'b | c' });
  assert.equal(T.cluesOf({ body: 'x' }).length, 0);
});

/* =================================================================
   7. JUDGING TELEXES BY STEERING  (voyage.js, with a fake ship)
   README: true course held 3 s = right; false order read and not
   followed for 20 s = right; false order followed 5 s = wrong;
   false course held 30 s = game over.
   ================================================================= */

test('true order: not judged before it is read, however long she holds its course', () => {
  const h = voyage([trueCourse('TX-01', 'T+0:00', 72)]);
  h.ship.heading = 72;
  h.run(30);
  assert.equal(h.rec('TX-01').judged, null);
  h.read('TX-01');
  h.run(3);
  assert.equal(h.rec('TX-01').judged, 'trust');
});

test('true order: trusted after exactly 3 s on course, not before', () => {
  const h = voyage([trueCourse('TX-01', 'T+0:00', 72)]);
  h.run(1);
  h.read('TX-01');
  h.ship.heading = 72;
  h.run(2.5, 0.5);
  assert.equal(h.rec('TX-01').judged, null);
  h.run(0.5, 0.5);
  assert.equal(h.rec('TX-01').judged, 'trust');
  assert.equal(h.rec('TX-01').correct, true);
});

test('true order: wandering off course restarts the 3 s', () => {
  const h = voyage([trueCourse('TX-01', 'T+0:00', 72)]);
  h.run(1);
  h.read('TX-01');
  h.ship.heading = 72;  h.run(2);
  h.ship.heading = 200; h.run(1);
  h.ship.heading = 72;  h.run(2);
  assert.equal(h.rec('TX-01').judged, null);
  h.run(1);
  assert.equal(h.rec('TX-01').judged, 'trust');
});

test('true order with no course: right once read, not before', () => {
  const h = voyage([trueNotice('TX-00', 'T+0:00')]);
  h.run(30);
  assert.equal(h.rec('TX-00').judged, null);
  h.read('TX-00');
  assert.equal(h.rec('TX-00').judged, 'trust');
  assert.equal(h.rec('TX-00').correct, true);
});

test('false order never read: never judged, scores as wrong', () => {
  const h = voyage([falseCourse('TX-02', 'T+0:00', 180)]);
  h.ship.heading = 180;          // even sat on its course
  h.run(60);
  assert.equal(h.rec('TX-02').judged, null);
  assert.equal(h.v.score().telexes, 0);
  assert.equal(h.ending, null);  // can't be lured by a slip you never read
});

test('false order read and ignored: refused at exactly 20 s', () => {
  const h = voyage([falseCourse('TX-02', 'T+0:00', 180)]);
  h.run(1);
  h.read('TX-02');
  h.run(19);
  assert.equal(h.rec('TX-02').judged, null);
  h.run(1);
  assert.equal(h.rec('TX-02').judged, 'reject');
  assert.equal(h.rec('TX-02').correct, true);
});

test('false order followed: trusted (wrong) at exactly 5 s, not 4', () => {
  const h = voyage([falseCourse('TX-02', 'T+0:00', 180)]);
  h.run(1);
  h.read('TX-02');
  h.ship.heading = 180;
  h.run(4);
  assert.equal(h.rec('TX-02').judged, null);
  h.run(1);
  assert.equal(h.rec('TX-02').judged, 'trust');
  assert.equal(h.rec('TX-02').correct, false);
});

test('false order: holding its course 30 s ends the game, 29 s does not', () => {
  const h = voyage([falseCourse('TX-02', 'T+0:00', 180)]);
  h.run(1);
  h.read('TX-02');
  h.ship.heading = 180;
  h.run(29);
  assert.equal(h.ending, null, 'ended after only 29 s on the false course');
  h.run(1);
  assert.equal(h.ending && h.ending.kind, 'lured');
});

test('false order sending you home ends as turnedBack', () => {
  const h = voyage([falseCourse('TX-04', 'T+0:00', 270, { lure: 'turnedBack' })]);
  h.run(1);
  h.read('TX-04');
  h.ship.heading = 270;
  h.run(40);
  assert.equal(h.ending && h.ending.kind, 'turnedBack');
});

test('a refusal is overturned by following the order before the next telex', () => {
  const h = voyage([falseCourse('TX-02', 'T+0:00', 180)]);
  h.run(1);
  h.read('TX-02');
  h.verdict('TX-02', false);                // "Suspect"
  assert.equal(h.rec('TX-02').judged, 'reject');
  h.ship.heading = 180;
  h.run(5);
  assert.equal(h.rec('TX-02').judged, 'trust');
  assert.equal(h.rec('TX-02').correct, false);
});

test('once a newer telex prints, an old false order is refused for good', () => {
  const h = voyage([falseCourse('TX-02', 'T+0:00', 180), trueNotice('TX-05', 'T+0:10')]);
  h.run(1);
  h.read('TX-02');
  h.run(10);                                // TX-05 prints before the 20 s are up
  assert.equal(h.rec('TX-05').delivered, true);
  assert.equal(h.rec('TX-02').judged, 'reject');
  h.ship.heading = 180;                     // following it now changes nothing
  h.run(40);
  assert.equal(h.rec('TX-02').judged, 'reject');
  assert.equal(h.ending, null);
});

test('a true course order rescues a boat being lured', () => {
  const h = voyage([falseCourse('TX-02', 'T+0:00', 180), trueCourse('TX-03', 'T+0:20', 15)]);
  h.run(1);
  h.read('TX-02');
  h.ship.heading = 180;
  h.run(40);                                // 40 s on the false course, but TX-03 came at 20
  assert.equal(h.ending, null);
  assert.equal(h.v.lure, null);
});

/* =================================================================
   8. THE CIPHER-DESK BUTTONS  (telexverdict events)
   ================================================================= */

test('"Genuine" on a true order with a course does nothing: it must be steered', () => {
  const h = voyage([trueCourse('TX-01', 'T+0:00', 72)]);
  h.ship.heading = 200;
  h.run(1);
  h.verdict('TX-01', true);
  assert.equal(h.rec('TX-01').judged, null);
});

test('"Suspect" on a true notice is wrong; "Genuine" on a false order is wrong', () => {
  const h = voyage([trueNotice('TX-05', 'T+0:00')]);
  h.run(1);
  h.verdict('TX-05', false);
  assert.equal(h.rec('TX-05').correct, false);

  const g = voyage([falseCourse('TX-02', 'T+0:00', 180)]);
  g.run(1);
  g.read('TX-02');
  g.verdict('TX-02', true);
  assert.equal(g.rec('TX-02').judged, 'trust');
  assert.equal(g.rec('TX-02').correct, false);
});

test('"Suspect" on a false order is right', () => {
  const h = voyage([falseCourse('TX-02', 'T+0:00', 180)]);
  h.run(1);
  h.read('TX-02');
  h.verdict('TX-02', false);
  assert.equal(h.rec('TX-02').correct, true);
});

/* =================================================================
   9. ONE SLIP AT A TIME  (feedTelex)
   ================================================================= */

test('a second telex waits while the first lies unread', () => {
  const h = voyage([trueNotice('TX-00', 'T+0:00'), trueNotice('TX-K1', 'T+0:00')]);
  h.run(60);
  assert.equal(h.rec('TX-00').delivered, true);
  assert.equal(h.rec('TX-K1').delivered, false);
  h.read('TX-00');
  h.run(1);
  assert.equal(h.rec('TX-K1').delivered, true);
});

test('after the slip is put down, the next waits exactly 3 s (telexGap)', () => {
  const h = voyage([trueNotice('TX-00', 'T+0:00'), trueNotice('TX-K1', 'T+0:00')]);
  h.run(1);
  h.read('TX-00');
  h.ctx.now = 50000;
  h.emit('signalputdown', {});
  h.ctx.now = 52999; h.run(1);
  assert.equal(h.rec('TX-K1').delivered, false);
  h.ctx.now = 53000; h.run(1);
  assert.equal(h.rec('TX-K1').delivered, true);
});

test('nothing prints while the player is reading another sheet', () => {
  const h = voyage([trueNotice('TX-00', 'T+0:00')]);
  h.ship.reading = true;
  h.run(10);
  assert.equal(h.rec('TX-00').delivered, false);
  h.ship.reading = false;
  h.run(1);
  assert.equal(h.rec('TX-00').delivered, true);
});

test('an unread slip gets one reminder, at 20 s', () => {
  const h = voyage([trueNotice('TX-00', 'T+0:00')]);
  h.run(1);                                     // printed at t = 1
  h.run(19);
  assert.ok(!h.said.includes('remind:unread'));
  h.run(1);
  assert.equal(h.said.filter(e => e === 'remind:unread').length, 1);
  h.run(60);
  assert.equal(h.said.filter(e => e === 'remind:unread').length, 1);
});

/* =================================================================
   10. OFF COURSE AND THE ENDINGS
   ================================================================= */

test('off course: no nagging in the 20 s grace, then gentle, then urgent', () => {
  const h = voyage([trueCourse('TX-01', 'T+0:00', 72)]);
  h.ship.heading = 200;
  h.run(20);
  assert.ok(!h.said.includes('remind:offCourse'), 'nagged during the grace period');
  h.run(15);                                    // grace + 15 s
  assert.ok(h.said.includes('remind:offCourse'));
  assert.ok(!h.said.includes('remind:offCourseUrgent'));
  h.run(25);                                    // grace + 40 s
  assert.ok(h.said.includes('remind:offCourseUrgent'));
});

test('off course: each reminder once per spell; back on course starts afresh', () => {
  const h = voyage([trueCourse('TX-01', 'T+0:00', 72)]);
  h.ship.heading = 200; h.run(80);
  assert.equal(h.said.filter(e => e === 'remind:offCourse').length, 1);
  h.ship.heading = 72;  h.run(1);
  h.ship.heading = 200; h.run(16);
  assert.equal(h.said.filter(e => e === 'remind:offCourse').length, 2);
});

// Sail the fake boat round the marks before route mark n (1 = the first), a frame at
// each, then put her this many metres short of mark n on the line from the one before
function placeBefore(h, n, short) {
  const marks = h.ctx.TELEX_COURSE.marks;
  for (let k = h.v.legNow; k < n; k++) {
    h.ship.position = { x: marks[k - 1].x, y: marks[k - 1].y };
    h.run(1);
  }
  const to = marks[n - 1], from = n > 1 ? marks[n - 2] : { x: 0, y: 0 };
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  h.ship.position = { x: to.x - (to.x - from.x) * short / len, y: to.y - (to.y - from.y) * short / len };
}
const GOAL = TELEX_COURSE.marks.length;

test('victory: reaching the beach wins; just outside the arrival circle does not', () => {
  const h = voyage([]);
  const arrive = h.ctx.TELEX_COURSE.arrive;
  placeBefore(h, GOAL, arrive + 1);
  h.run(1);
  assert.equal(h.ending, null);
  placeBefore(h, GOAL, arrive - 1);
  h.run(1);
  assert.equal(h.ending && h.ending.kind, 'victory');
});

test('victory: reaching an early mark is not enough; each mark passed is announced once', () => {
  const h = voyage([]);
  placeBefore(h, 3, 0);
  h.run(5);
  assert.equal(h.ending, null);
  assert.deepEqual(h.said.filter(e => e.startsWith('mark:')), ['mark:1', 'mark:2', 'mark:3']);
});

test('goal:near is said once, within 700 m of the beach', () => {
  const h = voyage([]);
  placeBefore(h, GOAL, 701);
  h.run(1);
  assert.ok(!h.said.includes('goal:near'));
  placeBefore(h, GOAL, 699);
  h.run(1);
  placeBefore(h, GOAL, 600);
  h.run(1);
  assert.equal(h.said.filter(e => e === 'goal:near').length, 1);
});

test('out of time: the game ends at 18:00, not a second before', () => {
  const h = voyage([trueCourse('TX-01', 'T+0:00', 72)]);
  h.ship.heading = 200;
  h.run(779);
  assert.equal(h.ending, null);
  h.run(1);
  assert.equal(h.ending && h.ending.kind, 'outOfTime');
  assert.equal(h.ending.score.time, '18:00');
});

test('the game ends once; later frames change nothing', () => {
  const h = voyage([]);
  placeBefore(h, GOAL, 0);
  h.run(1);
  const first = h.ending;
  assert.equal(first && first.kind, 'victory');
  h.run(400);
  assert.equal(h.ending, first);
});

test('score: counts only correct telexes, out of every telex', () => {
  const h = voyage([trueNotice('TX-00', 'T+0:00'), falseCourse('TX-02', 'T+0:00', 180)]);
  h.run(1);
  h.read('TX-00');
  h.run(1);                                       // TX-02 prints, never read
  const s = h.v.score();
  assert.equal(s.telexes, 1);
  assert.equal(s.telexTotal, 2);
});

/* =================================================================
   11. SIGHTINGS  (buoys and aircraft)
   ================================================================= */

const mark = (id, at, until) => ({
  id, mode: 'SPOT', trigger: { type: 'time', value: at }, until,
  sighting: { kind: 'mark', art: 'buoy', ahead: 100, w: 1, h: 1 }
});
const plane = (id, at) => ({
  id, mode: 'SPOT', trigger: { type: 'time', value: at }, sighting: { kind: 'aircraft', aircraft: 'german' }
});

test('buoy: only appears if you are on course; missed off course otherwise', () => {
  const h = voyage([trueCourse('TX-01', 'T+0:00', 72), mark('S-1', 'T+0:05', 'T+0:30')]);
  h.ship.heading = 200;
  h.run(31);
  assert.equal(h.ship.marks.length, 0);
  assert.ok(h.said.includes('S-1:missedOffCourse'));
});

test('buoy: spotted after exactly half a second in the glasses', () => {
  const h = voyage([trueCourse('TX-01', 'T+0:00', 72), mark('S-1', 'T+0:05', 'T+0:30')]);
  h.ship.heading = 72;
  h.run(5);
  h.ship.glasses = true;
  h.run(0.25, 0.25);
  assert.ok(!h.said.includes('S-1:spotted'));
  h.run(0.25, 0.25);
  assert.ok(h.said.includes('S-1:spotted'));
});

test('buoy: on course but never looked at counts as missed at its deadline', () => {
  const h = voyage([trueCourse('TX-01', 'T+0:00', 72), mark('S-1', 'T+0:05', 'T+0:30')]);
  h.ship.heading = 72;
  h.run(29);
  assert.ok(!h.said.some(e => e.startsWith('S-1:')));
  h.run(1);
  assert.ok(h.said.includes('S-1:missed'));
});

test('aircraft: identified once; reported once; gone after identifying is not "missed"', () => {
  const h = voyage([plane('A-1', 'T+0:01')]);
  h.run(2);
  h.emit('aircraftidentified', { correct: true });
  h.emit('aircraftidentified', { correct: false });   // a second answer is ignored
  h.emit('aircraftreported', {});
  h.emit('aircraftreported', {});
  h.emit('aircraftgone', {});
  assert.deepEqual(h.said.filter(e => e.startsWith('A-1')), ['A-1:correct', 'A-1:reported']);
});

test('aircraft: flying past unidentified is missed; a wrong call cannot be reported', () => {
  const h = voyage([plane('A-1', 'T+0:01')]);
  h.run(2);
  h.emit('aircraftgone', {});
  assert.ok(h.said.includes('A-1:missed'));

  const w = voyage([plane('A-1', 'T+0:01')]);
  w.run(2);
  w.emit('aircraftidentified', { correct: false });
  w.emit('aircraftreported', {});
  assert.deepEqual(w.said.filter(e => e.startsWith('A-1')), ['A-1:wrong']);
});


/* =================================================================
   12. THE ROUTE AND THE CIPHER TOGETHER
       (voyage.js signal / headers / replay / tamper, course.js stamp)
   ================================================================= */

// A loaded signal file, as the ship's TELEX.get hands it over
function signalFile(h, id, text) {
  const sig = T.parseSignal(text);
  sig.id = id;
  h.ctx.TELEX = { get: name => (name === id ? sig : undefined) };
  return sig;
}
const ORDER = 'SERIAL: NR 014\nTIME: 2212Z/29 MAY 40\n---\nNext mark: {MARK}. Steer {COURSE}.';
const routeOrder = (id, at, extra) =>
  telex(id, at, { correctAction: 'trust', signal: id, text: undefined, ...extra });

test('a signal file is numbered as it goes out; the file is left as written', () => {
  const h = voyage([routeOrder('TX-01', 'T+0:00', { number: true }),
                    routeOrder('TX-02', 'T+0:00', { number: true, signal: 'TX-01' })]);
  const file = signalFile(h, 'TX-01', ORDER);
  h.run(1);
  h.read('TX-01');
  h.ctx.now += 10000; h.run(1);
  assert.equal(h.rec('TX-01').sig.serial, 'NR 037');           // on from TX-K1, NR 034
  assert.equal(h.rec('TX-02').sig.serial, 'NR 039');
  assert.equal(file.serial, 'NR 014');
  assert.match(file.body, /\{MARK\}/);
});

test('a signal file prints with the course to the next mark, and that course is steered', () => {
  const h = voyage([routeOrder('TX-01', 'T+0:00')]);
  signalFile(h, 'TX-01', ORDER);
  h.run(1);
  const rec = h.rec('TX-01');
  assert.equal(rec.leg, 1);
  assert.equal(rec.course, 0);                                  // due north to the fairway buoy
  assert.match(rec.sig.body, /Steer 000\./);
  h.read('TX-01');
  h.ship.heading = 0;
  h.run(3);
  assert.equal(rec.judged, 'trust');
});

test('headers: debrief and cipher headers are added, and win over the file\'s own', () => {
  const h = voyage([routeOrder('TX-01', 'T+0:00', {
    headers: 'GENUINE:  yes\nCLUE 1:   Next mark | It names one.\nCIPHER: VIGENERE\nKEYWORD: DYNAMO\nTIME: 0600Z/30 MAY 40'
  })]);
  signalFile(h, 'TX-01', ORDER);
  h.run(1);
  const sig = h.rec('TX-01').sig;
  assert.equal(sig.genuine, 'yes');
  assert.equal(sig.clue_1, 'Next mark | It names one.');
  assert.equal(sig.time, '0600Z/30 MAY 40');
  assert.ok(T.isEnciphered(sig));
});

test('an enciphered order has its figures written out, so none prints in clear', () => {
  const h = voyage([routeOrder('TX-01', 'T+0:00', { headers: 'CIPHER: VIGENERE\nKEYWORD: DYNAMO' })]);
  signalFile(h, 'TX-01', 'SERIAL: NR 014\n---\nSteer {COURSE}. {HELM} Mark at {POSITION}.');
  h.ship.heading = 90;
  h.run(1);
  const sig = h.rec('TX-01').sig;
  assert.doesNotMatch(sig.body, /\d/);
  assert.match(sig.body, /Steer zero zero zero\./);
  assert.match(sig.body, /plus one zero zero zero/);
  assert.doesNotMatch(T.bodyText(sig), /\d/);
});

test('an order in clear keeps its figures', () => {
  const h = voyage([routeOrder('TX-01', 'T+0:00')]);
  signalFile(h, 'TX-01', ORDER);
  h.run(1);
  assert.match(h.rec('TX-01').sig.body, /Steer 000\./);
});

test('tamper: same number and time as the original, sent in clear, course changed', () => {
  const h = voyage([
    routeOrder('TX-06', 'T+0:00', { number: true, headers: 'CIPHER: VIGENERE\nKEYWORD: DYNAMO\nKEY NAME: DAY KEY 30 MAY' }),
    { id: 'TX-11', mode: 'TELEX', trigger: { type: 'after', value: 'TX-06:read', delay: 12 },
      correctAction: 'reject', tamper: 'TX-06', headers: 'GENUINE: no' }
  ]);
  signalFile(h, 'TX-06', ORDER);
  h.run(1);
  const orig = h.rec('TX-06');
  assert.ok(T.isEnciphered(orig.sig));
  h.read('TX-06');
  h.ctx.now += 10000;
  h.run(11);
  assert.equal(h.rec('TX-11').delivered, false);               // due 12 s after it was read
  h.run(2);
  const fake = h.rec('TX-11');
  assert.equal(fake.delivered, true);
  assert.equal(fake.sig.serial, orig.sig.serial);
  assert.equal(fake.sig.time, orig.sig.time);
  assert.equal(fake.sig.genuine, 'no');
  assert.ok(!T.isEnciphered(fake.sig), 'the tampered copy should be in clear');
  assert.equal(fake.lure, 100);                                 // 000 with its first figure changed
  assert.match(fake.sig.body, /Steer 100\./);
});

test('replay: an earlier true order again, word for word, number and all', () => {
  const h = voyage([
    routeOrder('TX-01', 'T+0:00', { number: true }),
    { id: 'TX-10', mode: 'TELEX', trigger: { type: 'time', value: 'T+0:30' },
      correctAction: 'reject', replay: true, headers: 'GENUINE: no' }
  ]);
  signalFile(h, 'TX-01', ORDER);
  h.run(1);
  h.read('TX-01');
  h.ctx.now += 10000;
  h.run(31);
  const old = h.rec('TX-01'), fake = h.rec('TX-10');
  assert.equal(fake.delivered, true);
  assert.equal(fake.sig.serial, old.sig.serial);
  assert.equal(fake.sig.body, old.sig.body);
  assert.equal(fake.sig.genuine, 'no');
  assert.equal(fake.lure, old.course);
});

test('a leg-triggered telex waits for the boat to reach that leg', () => {
  const h = voyage([telex('TX-03', 'T+0:00', { correctAction: 'trust', trigger: { type: 'leg', value: 3 } })]);
  h.run(30);
  assert.equal(h.rec('TX-03').delivered, false);
  placeBefore(h, 2, 0);                                         // at mark 2: on leg 3 now
  h.run(1);
  assert.equal(h.rec('TX-03').delivered, true);
});

test('Voyage.headers: added just above the rule, or with a rule if there is none', () => {
  const H = Story.Voyage.headers;
  assert.equal(H('A: 1\n---\nbody', 'B: 2'), 'A: 1\nB: 2\n---\nbody');
  assert.equal(H('body only', { serial: 'NR 001' }), 'SERIAL: NR 001\n---\nbody only');
  assert.equal(H('A: 1\n---\ncosts $1', 'B: $&'), 'A: 1\nB: $&\n---\ncosts $1');
});
