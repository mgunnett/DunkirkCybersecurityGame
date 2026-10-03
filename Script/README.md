# Script — the story layer

The dialogue, the 13-minute voyage clock, the scripted telexes and sightings,
and the endings. It sits on top of the ship in `Ship Functionality Demo/` and
drives it from outside. The wheel, compass, telex, binoculars and rulebook
work exactly as they did.

Open `Ship Functionality Demo/shipbuild-demo.html`. Add `?debug` to the
address (or press <kbd>`</kbd>) for the debug panel.

## Files

```
dialogue.js          THE SCRIPT. Every line, telex, sighting and tuning number.
                     Writers only ever need this file.
clock.js             The game clock: T = 0 at 05:00, T = 780 at 18:00.
dialogue-manager.js  The timing system: queue, typewriter, CLICK / AUTO / AUTO_CLICK.
voyage.js            Sends the telexes, judges them, tracks the route,
                     runs the sightings and reminders, decides the ending.
game.js              The flow TITLE → INTRO → VOYAGE → ENDING, the screens,
                     the clock plate and the debug panel.
script.css           How the dialogue box, screens and clock plate look.
```

They load at the bottom of `shipbuild-demo.html`, in that order. The route
itself is in `Telex Machine Demo/course.js`, which the ship loads.

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

### Pausing

During the voyage a pause button sits beside the clock, top left (or press
<kbd>P</kbd>). Pausing stops the clock, the boat and the dialogue, and puts up
a *Resume* / *Start over* card. Switching tabs pauses too. Nothing is saved:
reloading the page starts a new game.

### How a telex is judged

Every telex carries Seth's `GENUINE`, `CLUE n` and `LESSON` headers, so the
cipher desk (`Telex Machine Demo/decoder.js`) asks **"Is this signal genuine?"**
beside the slip. None of those headers print on the slip, and the clues only
appear in the debrief after the player answers.

- **Suspect** refuses the telex.
- **Genuine** on a false order trusts it (wrong).
- **Genuine** on a true order with a course does nothing yet: it still has to be steered.

Without the buttons, the player judges a message by how they steer:

| Telex | Judged correct when… | Judged wrong when… |
| --- | --- | --- |
| True, with a course (TX-01 to TX-06) | once read, the boat holds its course for 3 s, or reaches the mark it gave | it never does |
| True, no course (TX-00, TX-K1, TX-09) | it is read | it is never read, or is called Suspect |
| False | it was read, and 20 s pass without following it | the player follows its course for 5 s, or never reads it |

A refusal only holds while that telex is the latest one: following it later,
before the next telex prints, still counts as falling for it, whichever button
was pressed. Hold a false course for **30 s** and the game ends (*lured* or
*turned back*). Holding a course that is both the false one and the true one
doesn't count as following the fake.

Only one slip fits in the machine. If a telex comes due while the last one is
unread, it waits until that one has been read and put down. That includes
Dover's reply to an aircraft report.

### The cipher desk

Every slip, once read, is filed on Seth's cipher desk: the folder beside the
teleprinter. The rulebook's *Signals in Cipher* and *Decoding a Signal*
chapters explain it to the player.

- **TX-K1** is the day key (`DAY KEY 30 MAY`, keyword DYNAMO). **TX-04**
  (the leg for the Kwinte buoy) and **TX-06** (the last leg, for the beach)
  come enciphered under it, so the player has to decode them to learn the
  course. Their courses are still worked out from where the boat is, and
  `course.js` writes every figure in them out in words (*zero six one*),
  because the cipher only changes letters.
- **TX-K2** is a forged "replacement key" (SEAGULL), and **TX-12** a forged
  order enciphered under it. TX-12 reads perfectly under SEAGULL and is
  gibberish under the day key; the true orders are the other way round.

A German aircraft rightly identified can be reported on the telex (Seth's
**Report sighting** button); that gives the sighting's `:reported` line.

### Route

The route is six legs, laid out as a chain of marks in
`Telex Machine Demo/course.js`: the fairway buoy, the Gull Stream buoy, the
North Goodwin light vessel, the Kwinte buoy, the Zuydcoote Pass, then the
beach. It zig-zags (about 000, 055, 353, 061, 354, 052) rather than running
straight at the beach, which lies at about 030.

The true orders are the signal files `01-sailing-orders.js` to `06-recall.js`.
TX-01 prints at T+0:35; each of the others prints as the boat reaches the mark
before its leg. Its course and wheel order are worked out from where the boat
is at that moment, so a boat that has drifted is steered back. The course she
should be on is the live bearing of her current mark, and that is what the
tolerance (±20°) and the off-course reminders measure against.

Reaching the beach (within 250 m) wins. That's about 13:15 with perfect
steering, so there is nearly five hours of in-game slack before the 18:00
deadline: time to decode the orders in cipher.

### Numbers and times

Genuine signals must fit the series (rulebook checks 3 and 4), but the orders
arrive whenever the boat gets there. So every telex marked `number: true` is
given the next serial number and a time of origin five in-game minutes before
it prints, carrying on from TX-K1's NR 034 / 0515Z. The spoof TX-07, the
forged key TX-K2 and the forged cipher TX-12 are numbered the same way, so
their number and time fit and something else gives them away. The replay and
the tampered copy keep the number and time of the order they copy.

## What changed from the original script, and why

The script was written without the code to hand. These changes make it match
what's built:

| Script said | Now | Why |
| --- | --- | --- |
| Motor launch *Kittiwake* | Motor yacht **Kestrel**, call sign **GBKW** | That's the boat on the telex (`config.js`) and in the rulebook. |
| Stamp, Caesar cipher, codeword | The rulebook's **five checks**: who sent it, is it for us, does the number fit, does the time fit, does the order make sense; and a **Vigenère day key** for the orders in cipher | That's what the rulebook teaches, and what the cipher desk decodes. |
| Headings EAST / NORTHEAST / SOUTHWEST | Six legs zig-zagging north-east, each course **worked out from where the boat is** as the order prints | Dunkirk lies north-east of the start in the game world. The rulebook says courses are always three figures, and a true change of course says why. |
| "Eight telexes" | **Fifteen**: TX-00, the day key TX-K1, the six orders TX-01 to TX-06 and the warning TX-09 are true; TX-07, TX-08, the forged key TX-K2, TX-10, TX-11 and the forged cipher TX-12 are false | Six true orders, one per leg, plus the test, the key, the warning, and a fake for each lesson. The score uses the real count. |
| Key rotation | TX-09, a true **security warning**: "enemy is sending false signals in our name"; then TX-K2, a forged key change | Same lesson, both ways: Dover knows it's being copied, and the enemy uses that as cover. |
| No-crown stamp, old key | TX-10, a **replay**: an earlier true order sent again, word for word (old number, old time) | Stale credentials, using checks 3 and 4. |
| Fake "stop engines and wait", then a true order | TX-06 **true**, in cipher (the last leg); TX-11 the **same signal, same number, in clear, with its course changed** | The boat can't stop (constant speed). Tampering is easier to spot after the true version. The rulebook covers this exact trick. |
| FRIEND / ENEMY | The binoculars' **German / Allied** question | That's the existing question. |
| N. Goodwin and Kwinte **buoys** | A red **N. GOODWIN light vessel** and a green **KWINTE** buoy, on their marks of the route | The real North Goodwin was a light vessel, and the telex text already says so. |
| 27–28 May | Phone call 29 May, voyage **30 May 1940** | Fits the rulebook's example signal (0412Z/30 MAY 40). |

### Answer key

Numbers, times and courses below are from a perfect run; they shift with the
player.

| Telex | When | Says | Fails | Correct action | Cyber idea |
| --- | --- | --- | --- | --- | --- |
| TX-00 | T+0:15 | NR 033, test of line | – | Read it | Know what normal looks like |
| TX-K1 | T+0:25 | NR 034, day key DYNAMO | – | Read it, keep the key | Keys travel apart from the messages they unlock |
| TX-01 | T+0:35 | NR 037, sailing orders, leg 1 (000) | – | Steer it | A true message passes every check |
| TX-02 | at the fairway buoy | NR 039, Route Z under fire, leg 2 (about 055), says why | – | Steer it | True changes give a reason |
| TX-07 | T+1:50 | NR 042 from **V.A. DOVRE**, steer 180 for Calais, in the same form as a true order | 1, 5 | Ignore | Spoofing: a lookalike sender |
| TX-03 | at the Gull Stream buoy | NR 044, leg 3 (about 353), round the Goodwins | – | Steer it | True changes give a reason |
| TX-08 | T+4:00 | **URGENT**, from the First Lord, to all small craft, no number, "9 o'clock", turn back and use the wireless | 1–5 | Ignore | Phishing: urgency, authority, "no time to check" |
| TX-04 | at the North Goodwin | NR 047 **in cipher** under the day key: leg 4 (about *zero six one*), for the Kwinte buoy | – | Decode it, steer it | Encryption hides a message and proves who sent it |
| TX-09 | T+5:15 | NR 049, warning, no new course | – | Read it | Security warnings |
| TX-05 | at the Kwinte buoy | NR 052, leg 5 (about 354), for the Zuydcoote Pass | – | Steer it | True changes give a reason |
| TX-K2 | T+5:40 | NR 054, "day key compromised", replacement key SEAGULL, "do not confirm" | 5 | Ignore (Suspect) | Key substitution |
| TX-10 | T+6:00 | **An earlier order again**, its old number and time: the one furthest off her course now (in a perfect run TX-04, NR 047, in cipher, 061) | 3, 4 | Ignore | Replay attack |
| TX-12 | T+6:25 | NR 057 **in cipher** under the **replacement key**: steer one one zero, break wireless silence | 5 | Ignore | A message is only as good as its key |
| TX-06 | at the Zuydcoote Pass | NR 059 **in cipher** under the day key: the last leg (about *zero five two*), for the beach | – | Decode it, steer it | Encryption hides a message and proves who sent it |
| TX-11 | 12 s after TX-06 is read | **TX-06 again**, same number and time, **in clear**, course changed by 100 (about 152) | 3, 5 | Ignore | Tampering (man-in-the-middle) |

The binoculars teach checking through a second channel (the light vessel and
the buoy lie on the marks the orders name, so a boat where the orders say
she is will see them), and identifying by several features at once (WEFT on
the aircraft).

### Aircraft

Five come over, one at a time. One due while another is still up waits until
the sky is clear; Tom's "Hear that?" lines go on `:overhead`, so they always
match what's in the sky.

| Sighting | Due | Aircraft | Side | What gives it away |
| --- | --- | --- | --- | --- |
| BN-05 | T+1:25 | Hawker Hurricane | Allied | Thick wing, rounded tips, radiator under the belly, roundels |
| BN-06 | T+3:45 | Messerschmitt Bf 109 | German | Like a Spitfire, but square-cut wingtips and black crosses |
| BN-02 | T+4:50 | Supermarine Spitfire | Allied | Elliptical wing, roundels |
| BN-07 | T+6:10 | Heinkel He 111 | German | Two engines, glazed nose, a bomber |
| BN-04 | T+7:15 | Junkers Ju 87 Stuka | German | Bent gull wing, fixed spatted wheels |

German ones, rightly called, can be reported on the telex.

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
- `tamper: 'TX-06'`: that order again, same number and time, in clear, with
  its course changed by 100 degrees (052 becomes 152).

`headers` adds header lines to any of these, written as in a signal file.
Use it for the `GENUINE` / `CLUE n` / `LESSON` debrief on a telex built from a
signal file, a replay or a tamper, and for `CIPHER` / `KEYWORD` / `KEY NAME`
to send a signal file in cipher. They win over the file's own headers.
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
`sighting: { kind: 'aircraft', aircraft: 'hurricane' | 'bf109' | 'spitfire' | 'he111' | 'stuka' }`.

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
  next to the existing `aircraftspotted` and `aircraftidentified`. The Script
  also listens for Seth's `telexverdict` and `aircraftreported`.
- `signalread` fires only for the slip in the machine, not for a page re-read
  off the cipher desk, and names the signal so a recon reply isn't mistaken
  for a story telex. `SHIP.slipWaiting` tells the Script a slip is still
  unread; `SHIP.closeDesk()` puts the desk away for the endings.
- It loads `Telex Machine Demo/course.js`, and fills in each slip's course
  marks from the boat's position as the slip prints. Signal files are named
  after their file, and `TELEX.get('02-route-x')` hands one over as written.
- Links to `script.css` and the five scripts.

## Test checklist

Run the unit tests first, from the repo root: `node --test tests/`.

Use the debug panel. ×5 runs the clock five times faster; **Jump** goes
straight to a time. The panel shows the ordered course, the leg and how far
it is to the next mark, the slip in the machine, a fake being followed, and
✓ / ✗ for every telex and sighting (BN-01 to BN-07). Aircraft fly at normal
speed even when the clock is sped up, so at ×5 an aircraft nobody looks at
holds the others back.

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
- [ ] T+0:25: TX-K1, the day key (prints once TX-00 is put down). V-04b on reading. It lands in the cipher desk's key tray.
- [ ] Every slip shows "Is this signal genuine?" beside it; answering shows the clues and lesson.
- [ ] T+0:35: TX-01 (prints once TX-K1 is put down), NR 037, "You are on course… 000". Reading it gives V-05; holding 000 gives V-05b; 01 ✓.
- [ ] T+1:25: a Hurricane (V-18, V-19 as it comes over). *Allied* gives V-19a, *German* V-19b, letting it go V-19i.
- [ ] About T+1:37, at the fairway buoy: TX-02, NR 039, a turn to starboard onto about 055 with its reason (V-14, V-14b).
- [ ] T+1:50: TX-07 from DOVRE, numbered in sequence, with a full wheel order for 180. Reading gives V-07. Ignoring it for 20 s gives V-08 and 07 ✓.
- [ ] Again, steering 180 after reading: V-09 and 07 ✗; 30 s on 180 ends **Lured off course**.

**Act 2**
- [ ] About T+2:57, at the Gull Stream buoy: TX-03, a turn to port onto about 353 (V-14c). The N. GOODWIN light vessel is ahead on its mark; glasses on it gives V-12 (BN-01 ✓). Never near it: V-13. Passing it without a look: V-13b.
- [ ] T+3:45: a Bf 109 (V-19c). *German* gives V-19d, *Allied* V-19e; reporting it gives V-19g.
- [ ] T+4:00: TX-08. Steering 270 after reading gives V-17; 30 s ends **Turned back**. Ignoring it gives V-16.
- [ ] About T+4:05, at the light vessel: TX-04 prints in cipher (V-14d). Decoded under the day key it gives the course in words, about "zero six one"; with SEAGULL it's gibberish. Steering it gives V-14e. The KWINTE buoy is ahead on its mark (V-26 / V-26b / V-26c).
- [ ] T+4:50: a Spitfire (V-19h, once the Bf 109 has gone). *Allied* gives V-20, *German* gives V-21, letting it go gives V-21b.
- [ ] T+5:15: TX-09, reading gives V-22; 09 ✓.
- [ ] About T+5:27, at the Kwinte buoy: TX-05, onto about 354.
- [ ] T+5:40: TX-K2, the forged replacement key. V-22b on reading; *Suspect* gives V-22c, *Genuine* gives V-22d.
- [ ] T+6:00: TX-10, an earlier order with its old number and time: V-23 on reading; V-24 if ignored; steering its course gives V-25.
- [ ] T+6:25: TX-12 in cipher under REPLACEMENT KEY (V-25b). Gibberish under the day key, reads under SEAGULL. Ignoring it gives V-25c; steering 110 gives V-25d.

**Act 3**
- [ ] T+6:10: a He 111 (V-31a). *German* gives V-31b, *Allied* V-31c; reporting it gives V-31e.
- [ ] About T+6:30, at the Zuydcoote Pass: TX-06 prints in cipher (V-27). Decoded with the day key it gives the last leg, about "zero five two", for the beach (V-28).
- [ ] 12 s after TX-06 is read: TX-11, the same number and time, in clear, course about 152: V-29 on reading; V-30 if ignored; steering it gives V-31.
- [ ] T+6:40 smoke line; T+7:15 a Stuka (V-32b, V-33 / V-34 / V-34b).
- [ ] Identify the Stuka as German, lower the glasses and click *Report sighting* on the telex: V-34r, then Dover's reply prints (it waits if a slip is unread).
- [ ] 700 m from the beach: Tom's beach lines (V-35, V-36). T+11:00: "two hours to go" if still at sea.

**Reminders**
- [ ] Leave a slip unread 20 s: R-01.
- [ ] 15 s off the ordered course (after 45 s grace for a new order, time to decode one in cipher): R-02; 40 s: R-03.

**Endings**
- [ ] Perfect steering: **You reached the beaches** around 13:15 with 15 of 15 and 7 of 7.
- [ ] Never steering: **Too late** at 18:00.
- [ ] Each ending's lines play, then the score card; *Play again* returns to a fresh title.
