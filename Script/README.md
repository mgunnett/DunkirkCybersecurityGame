# Script — the story layer

The dialogue, the 10-minute voyage clock, the scripted telexes and sightings,
and the endings. It sits on top of the ship in `Ship Functionality Demo/` and
drives it from outside. The wheel, compass, telex, binoculars and rulebook
work exactly as they did.

Open `Ship Functionality Demo/shipbuild-demo.html`. Add `?debug` to the
address (or press <kbd>`</kbd>) for the debug panel.

## Files

```
dialogue.js          THE SCRIPT. Every line, telex, sighting and tuning number.
                     Writers only ever need this file.
clock.js             The game clock: T = 0 at 05:00, T = 600 at 15:00.
dialogue-manager.js  The timing system: queue, typewriter, CLICK / AUTO / AUTO_CLICK.
voyage.js            Sends the telexes, judges them by steering, tracks the course,
                     runs the sightings and reminders, decides the ending.
game.js              The flow TITLE → INTRO → VOYAGE → ENDING, the screens,
                     the clock plate and the debug panel.
script.css           How the dialogue box, screens and clock plate look.
```

They load at the bottom of `shipbuild-demo.html`, in that order.

## How a voyage runs

1. **Title.** The boat is held still. *Begin* starts the intro.
2. **Intro (Act 0).** Every line is CLICK, so students read at their own pace.
   The clock is stopped. At I-13 the rulebook opens over the scene; clicking
   on closes it. The last line starts the voyage.
3. **Voyage.** The clock runs, 1 real second = 1 in-game minute. Lines with a
   `time` trigger queue at their time. Telexes print on the ship's telex:
   some at their time, and the true orders one leg at a time, as the boat
   reaches each mark of the route. Lines with an `event` trigger queue when
   the player does something.
4. **Ending.** The boat is held, the dialogue clears, the ending lines play,
   then the score. *Play again* reloads the page, which resets everything.

### How a telex is judged (no TRUST / REJECT buttons)

The telex has no buttons, so the player judges a message by how they steer:

| Telex | Judged correct when… | Judged wrong when… |
| --- | --- | --- |
| True, with a course (TX-01 to TX-06) | once read, the boat holds its course for 3 s, or reaches the mark it gave | it never does |
| True, no course (TX-00, TX-09) | it is read | it is never read |
| False | it was read, and 20 s pass without following it | the player follows its course for 5 s, or never reads it |

A refusal only holds while that telex is the latest one: following it later,
before the next telex prints, still counts as falling for it. Hold a false
course for **30 s** and the game ends (*lured* or *turned back*). Holding a
course that is both the false one and the true one doesn't count as following
the fake.

Only one slip fits in the machine. If a telex comes due while the last one is
unread, it waits until that one has been read and put down.

### Route

The route is six legs, laid out as a chain of marks in
`Telex Machine Demo/course.js`: the fairway buoy, the Gull Stream buoy, the
North Goodwin light vessel, the Kwinte buoy, the Zuydcoote Pass, then the
beach. It zig-zags (about 000, 055, 354, 061, 355, 050) rather than running
straight at the beach, which lies at about 030.

The true orders are the signal files `01-sailing-orders.js` to `06-recall.js`.
TX-01 prints at T+0:35; each of the others prints as the boat reaches the mark
before its leg. Its course and wheel order are worked out from where the boat
is at that moment, so a boat that has drifted is steered back. The course she
should be on is the live bearing of her current mark, and that is what the
tolerance (±20°) and the off-course reminders measure against.

Reaching the beach (within 250 m) wins. That's about 13:10 with perfect
steering, so there is nearly two hours of in-game slack.

### Numbers and times

Genuine signals must fit the series (rulebook checks 3 and 4), but the orders
now arrive whenever the boat gets there. So every telex marked `number: true`
is given the next serial number and a time of origin five in-game minutes
before it prints, carrying on from TX-00's NR 033 / 0510Z. The spoof TX-07 is
numbered the same way, so only its sender and its order give it away. The
replay and the tampered copy keep the number and time of the order they copy.

## What changed from the original script, and why

The script was written without the code to hand. These changes make it match
what's built:

| Script said | Now | Why |
| --- | --- | --- |
| Motor launch *Kittiwake* | Motor yacht **Kestrel**, call sign **GBKW** | That's the boat on the telex (`config.js`) and in the rulebook. |
| Stamp, Caesar cipher, codeword | The rulebook's **five checks**: who sent it, is it for us, does the number fit, does the time fit, does the order make sense | That's what the rulebook teaches. The telex has no stamps or ciphers. |
| Headings EAST / NORTHEAST / SOUTHWEST | Six legs zig-zagging north-east, each course **worked out from where the boat is** as the order prints | Dunkirk lies north-east of the start in the game world. The rulebook says courses are always three figures, and a true change of course says why. |
| "Eight telexes" | **Twelve** (TX-00 to TX-11: eight true, four false) | Six true orders, one per leg, plus the test, the warning and the four fakes. The score uses the real count. |
| Key rotation | TX-09, a true **security warning**: "enemy is sending false signals in our name" | There's no key to rotate. Same lesson: Dover knows it's being copied. |
| No-crown stamp, old key | TX-10, a **replay**: an earlier true order sent again, word for word (old number, old time) | Stale credentials, using checks 3 and 4. |
| Fake "stop engines and wait", then a true order | TX-06 **true** (the last leg); TX-11 the **same signal, same number, with its course changed** | The boat can't stop (constant speed). Tampering is easier to spot after the true version. The rulebook covers this exact trick. |
| FRIEND / ENEMY | The binoculars' **German / Allied** question | That's the existing question. |
| N. Goodwin and Kwinte **buoys** | A red **N. GOODWIN light vessel** and a green **KWINTE** buoy, added to the sea | The real North Goodwin was a light vessel, and the telex text already says so. |
| 27–28 May | Phone call 29 May, voyage **30 May 1940** | Fits the rulebook's example signal (0412Z/30 MAY 40). |

### Answer key

| Telex | Says | Fails | Correct action | Cyber idea |
| --- | --- | --- | --- | --- |
Numbers and times below are from a perfect run; they shift with the player.

| Telex | When | Says | Fails | Correct action | Cyber idea |
| --- | --- | --- | --- | --- | --- |
| TX-00 | T+0:15 | NR 033, test of line | – | Read it | Know what normal looks like |
| TX-01 | T+0:35 | NR 036, sailing orders, leg 1 (000) | – | Steer it | A true message passes every check |
| TX-02 | at the fairway buoy | NR 038, Route Z under fire, leg 2 (about 055), says why | – | Steer it | True changes give a reason |
| TX-07 | T+1:50 | NR 041 from **V.A. DOVRE**, steer 180 for Calais, in the same form as a true order | 1, 5 | Ignore | Spoofing: a lookalike sender |
| TX-03 | at the Gull Stream buoy | NR 043, leg 3 (about 354), round the Goodwins | – | Steer it | True changes give a reason |
| TX-08 | T+4:00 | **URGENT**, from the First Lord, to all small craft, no number, "9 o'clock", turn back and use the wireless | 1–5 | Ignore | Phishing: urgency, authority, "no time to check" |
| TX-04 | at the North Goodwin | NR 046, leg 4 (about 061), for the Kwinte buoy | – | Steer it | True changes give a reason |
| TX-09 | T+5:15 | NR 048, warning, no new course | – | Read it | Security warnings |
| TX-05 | at the Kwinte buoy | NR 051, leg 5 (about 355), for the Zuydcoote Pass | – | Steer it | True changes give a reason |
| TX-10 | T+6:00 | **An earlier order again**, its old number and time: the one furthest off her course now (in a perfect run TX-04, NR 046, 061) | 3, 4 | Ignore | Replay attack |
| TX-06 | at the Zuydcoote Pass | NR 053, the last leg (about 050), for the beach | – | Steer it | A true message passes every check |
| TX-11 | 12 s after TX-06 is read | **TX-06 again**, same number and time, course changed by 100 (about 150) | 3, 5 | Ignore | Tampering (man-in-the-middle) |

The binoculars teach checking through a second channel (the light vessel and
the buoy lie on the marks the orders name, so a boat where the orders say
she is will see them), and identifying by several features at once (WEFT on
the aircraft).

## Editing the script (`dialogue.js`)

Every entry has the shape your prompt asked for:

```js
{ id: 'V-07', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7,
  trigger: { type: 'event', value: 'TX-07:read' },
  text: 'Number fits, time fits… but read the sender again, Skipper.' }
```

- **mode**: `CLICK`, `AUTO`, `AUTO_CLICK`, `TELEX` or `SPOT` (a sighting).
- **duration**: seconds an AUTO line stays up after it has typed out. Leave
  it out for 2 s + 0.3 s a word, minimum 3 s.
- **trigger**: `{ type: 'time', value: 'T+M:SS' }` or `{ type: 'event', value: '…' }`.
  The event names are listed at the top of `lines` in `dialogue.js`.
- **onShow / onDone**: `openRulebook`, `closeRulebook`, `startVoyage`.
- **scene**: a caption shown above the intro, such as `'Ramsgate harbour · 30 May 1940 · 04:30'`.
- **choices**: `[{ label: 'A', text: '…' }]`. The line waits for one to be picked.
- **critical: true**: never dropped from the queue, however long it waits.
- Ending lines can use `{time}`, `{telexes}`, `{telexTotal}`, `{sightings}`, `{sightingTotal}`.

**Telex entries** add `correctAction` (`'trust'` or `'reject'`), `lure`
(`'lured'` or `'turnedBack'`) for false ones, and their words, from one of:

- `signal: '02-route-x'`: a file in `Telex Machine Demo/signals/`. Its
  `{HELM}`, `{COURSE}`, `{MARK}` and the rest are filled in as it prints, from
  where the boat is. A true order written this way steers by the route.
- `text`: written exactly like a signal file: headers, a `---` rule, then the
  message. It can use the same marks; a `STEER: 180` header points its
  `{HELM}` at that course instead of the route's. Give a fixed true order
  `newHeading`, and a false one `lureHeading`.
- `replay: true`: an earlier true order sent again word for word, number and
  time included. The game picks the one furthest off the course she should be
  steering, and that is the course it lures her onto.
- `tamper: 'TX-06'`: that order again, same number and time, with its course
  changed by 100 degrees (050 becomes 150).

`number: true` gives a telex the next serial number and a time of origin
just before it prints (see *Numbers and times*). `fails` and `concept` are
notes for teachers.

**Telexes and sightings** can also be triggered by the route:
`{ type: 'leg', value: 3 }` once the boat is on leg 3, or
`{ type: 'after', value: 'TX-06:read', delay: 12 }` that many seconds after an
event. The voyage also sends `mark:1` to `mark:5` as each mark is reached, and
`goal:near` within `goalNear` metres of the beach, for lines to react to.

**Sighting entries** (`SPOT`) have `sighting: { kind: 'mark', art, mark, w, h }`
to sit on route mark `mark` (missed once the boat is well past it), or
`sighting: { kind: 'mark', art, ahead, offset, w, h }` with an `until` time to
appear ahead of the boat while she's on course, or
`sighting: { kind: 'aircraft', aircraft: 'stuka' | 'spitfire' }`.

Keep backticks and `${` out of any text.

The queue rules (from your prompt): lines never overlap; event lines jump to
the front; time lines that wait more than 10 s are dropped unless critical;
telexes never go through the queue, so they're never dropped. A click while a
line types finishes the line, and a second click moves on. Space does the same.

The numbers that tune the game (tolerance, numbering, how long to follow a
false order, reminder timings) are in `voyage` at the top of `dialogue.js`.
The route itself, and so how long the voyage takes, is in
`Telex Machine Demo/course.js`.

## What was added to the ship page

Only the hooks this layer needs. Without the Script, the helm runs exactly as
before (random signals and aircraft).

- `window.SHIP`: read the heading, position, start point, whether the glasses
  are up or a slip is in hand. Hold the boat still. Turn off random telexes
  and aircraft and send chosen ones. Add or remove a mark on the water. Ask
  whether a point is in the binoculars' view. Open or close the rulebook.
- Events: `signalarrived`, `signalread`, `signalputdown` and `aircraftgone`,
  next to the existing `aircraftspotted` and `aircraftidentified`.
- It loads `Telex Machine Demo/course.js`, and fills in each slip's course
  marks from the boat's position as the slip prints.
- Links to `script.css` and the five scripts.

## Test checklist

Use the debug panel. ×5 runs the clock five times faster; **Jump** goes
straight to a time. The panel shows the ordered course, the leg and how far
it is to the next mark, the slip in the machine, a fake being followed, and
✓ / ✗ for every telex (00–11) and sighting (BN-01 to BN-04).

Note: the debug speed-up runs the clock faster but the boat at normal speed,
and the orders wait for the boat to reach each mark. Check timing and endings
at ×1. Jump only moves the clock: orders waiting on a leg still wait for the boat.

**Intro**
- [ ] Title shows; *Begin* starts the intro. The boat doesn't move.
- [ ] Kent coast caption, then Hartley; I-03 and I-05 wait for a choice.
- [ ] Ramsgate caption at I-09. At I-13 the rulebook opens; clicking on closes it.
- [ ] I-18 starts the clock at 05:00 and the boat moves.

Times are for steering each order as it comes; a slower boat gets the
leg-triggered orders later.

**Act 1**
- [ ] T+0:03 and T+0:08: Tom's two lines.
- [ ] T+0:15: TX-00 prints, Tom notices it (V-03); reading it gives V-04; 00 ✓.
- [ ] T+0:35: TX-01 (prints once TX-00 is put down), NR 036, "You are on course… 000". Reading it gives V-05; holding 000 gives V-05b; 01 ✓.
- [ ] About T+1:37, at the fairway buoy: TX-02, NR 038, a turn to starboard onto about 055 with its reason (V-14, V-14b).
- [ ] T+1:50: TX-07 from DOVRE, numbered in sequence, with a full wheel order for 180. Reading gives V-07. Ignoring it for 20 s gives V-08 and 07 ✓.
- [ ] Again, steering 180 after reading: V-09 and 07 ✗; 30 s on 180 ends **Lured off course**.

**Act 2**
- [ ] About T+3:00, at the Gull Stream buoy: TX-03, a turn to port onto about 354 (V-14c). The N. GOODWIN light vessel is ahead on its mark; glasses on it gives V-12 (BN-01 ✓). Never near it: V-13. Passing it without a look: V-13b.
- [ ] T+4:00: TX-08. Steering 270 after reading gives V-17; 30 s ends **Turned back**. Ignoring it gives V-16.
- [ ] About T+4:05, at the light vessel: TX-04, onto about 061. The KWINTE buoy is ahead on its mark (V-26 / V-26b / V-26c).
- [ ] T+4:45 / 4:48: Tom on aircraft and WEFT. T+4:50: a Spitfire. *Allied* gives V-20, *German* gives V-21, letting it go gives V-21b.
- [ ] T+5:15: TX-09, reading gives V-22; 09 ✓.
- [ ] About T+5:30, at the Kwinte buoy: TX-05, onto about 355.
- [ ] T+6:00: TX-10, an earlier order with its old number and time: V-23 on reading; V-24 if ignored; steering its course gives V-25.

**Act 3**
- [ ] About T+6:30, at the Zuydcoote Pass: TX-06, onto about 050 for the beach (V-27, V-28).
- [ ] 12 s after TX-06 is read: TX-11, the same number and time, course about 150: V-29 on reading; V-30 if ignored; steering it gives V-31.
- [ ] T+6:40 smoke line; T+7:15 a Stuka (V-33 / V-34 / V-34b).
- [ ] 700 m from the beach: Tom's beach lines (V-35, V-36). T+8:00: "two hours to go" if still at sea.

**Reminders**
- [ ] Leave a slip unread 20 s: R-01.
- [ ] 15 s off the ordered course (after 20 s grace for a new order): R-02; 40 s: R-03.

**Endings**
- [ ] Perfect steering: **You reached the beaches** around 13:10 with 12 of 12 and 4 of 4.
- [ ] Never steering: **Too late** at 15:00.
- [ ] Each ending's lines play, then the score card; *Play again* returns to a fresh title.
