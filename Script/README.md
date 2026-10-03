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
   `time` trigger queue at their time. Telexes print on the ship's telex.
   Lines with an `event` trigger queue when the player does something.
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
| True, with a course | the boat holds that course for 3 s | it never does |
| True, no course (TX-00, TX-K1, TX-05) | it is read | it is never read, or is called Suspect |
| False | it was read, and 20 s pass without following it | the player follows its course for 5 s, or never reads it |

A refusal only holds while that telex is the latest one: following it later,
before the next telex prints, still counts as falling for it, whichever button
was pressed. Hold a false course for **30 s** and the game ends (*lured* or
*turned back*).

Only one slip fits in the machine. If a telex comes due while the last one is
unread, it waits until that one has been read and put down. That includes
Dover's reply to an aircraft report.

### The cipher desk

Every slip, once read, is filed on Seth's cipher desk: the folder beside the
teleprinter. The rulebook's *Signals in Cipher* and *Decoding a Signal*
chapters explain it to the player. The story sends three orders in cipher:

- **TX-K1** is the day key (`DAY KEY 30 MAY`, keyword DYNAMO). **TX-03**
  (the turn for the Kwinte Buoy) and **TX-07** (the turn for the beaches) come
  enciphered under it, so the player has to decode them to learn the course.
  Courses are written in words, because the cipher only changes letters.
- **TX-05b** is a forged "replacement key" (SEAGULL), and **TX-06b** a forged
  order enciphered under it. TX-06b reads perfectly under SEAGULL and is
  gibberish under the day key; the true orders are the other way round.

A German aircraft rightly identified can be reported on the telex (Seth's
**Report sighting** button); that gives the sighting's `:reported` line.

### Route

Each true order with a course starts a leg. Every second on that course
(within ±20°) is a second of progress. **460 s** of progress on the last leg
reaches the beaches. That's about 13:30 with perfect steering, so there is
roughly four and a half hours of in-game slack before the 18:00 deadline.

## What changed from the original script, and why

The script was written without the code to hand. These changes make it match
what's built:

| Script said | Now | Why |
| --- | --- | --- |
| Motor launch *Kittiwake* | Motor yacht **Kestrel**, call sign **GBKW** | That's the boat on the telex (`config.js`) and in the rulebook. |
| Stamp, Caesar cipher, codeword | The rulebook's **five checks**: who sent it, is it for us, does the number fit, does the time fit, does the order make sense | That's what the rulebook teaches. The telex has no stamps or ciphers. |
| Headings EAST / NORTHEAST / SOUTHWEST | Courses **072 → 015 → 040** | Dunkirk lies north-east of the start in the game world. EAST → NE would run onto the shoals, and SW turns away from the town. The rulebook says courses are always three figures. |
| "Eight telexes" | **Twelve** (TX-00 to TX-08, plus the day key TX-K1, the forged key TX-05b and the forged cipher TX-06b: six true, six false) | The script listed nine; the cipher desk added three. The score uses the real count. |
| TX-05: key rotation | A true **security warning**: "enemy is sending false signals in our name" | There's no key to rotate. Same lesson: Dover knows it's being copied. |
| TX-06: no-crown stamp, old key | A **replay**: TX-01 sent again (old number, old time) | Stale credentials, using checks 3 and 4. |
| TX-07 fake "stop engines and wait", TX-08 true | TX-07 **true** (steer 040); TX-08 the **same signal with one figure changed** (140) and the same number | The boat can't stop (constant speed). Tampering is easier to spot after the true version. The rulebook covers this exact trick. |
| FRIEND / ENEMY | The binoculars' **German / Allied** question | That's the existing question. |
| N. Goodwin and Kwinte **buoys** | A red **N. GOODWIN light vessel** and a green **KWINTE** buoy, added to the sea | The real North Goodwin was a light vessel, and the telex text already says so. |
| 27–28 May | Phone call 29 May, voyage **30 May 1940** | Fits the rulebook's example signal (0412Z/30 MAY 40). |

### Answer key

| Telex | Says | Fails | Correct action | Cyber idea |
| --- | --- | --- | --- | --- |
| TX-00 | NR 033, test of line | – | Read it | Know what normal looks like |
| TX-K1 | NR 034, day key DYNAMO | – | Read it, keep the key | Keys travel apart from the messages they unlock |
| TX-01 | NR 036, steer 072 | – | Steer 072 | A true message passes every check |
| TX-02 | NR 039 from **V.A. DOVRE**, steer 180 for Calais | 1, 5 | Ignore | Spoofing: a lookalike sender |
| TX-03 | NR 041 **in cipher** under the day key: steer zero one five, says why | – | Decode it, steer 015 | True changes give a reason |
| TX-04 | **URGENT**, from the First Lord, to all small craft, no number, "9 o'clock", turn back and use the wireless | 1–5 | Ignore | Phishing: urgency, authority, "no time to check" |
| TX-05 | NR 043, warning, no new course | – | Read it | Security warnings |
| TX-05b | NR 044, "day key compromised", replacement key SEAGULL, "do not confirm" | 5 | Ignore (Suspect) | Key substitution |
| TX-06 | **NR 036 again**, 0530Z, steer 072 | 3, 4 | Ignore | Replay attack |
| TX-06b | **NR 044 again**, in cipher under the **replacement key**: steer one one zero, break wireless silence | 3, 5 | Ignore | A message is only as good as its key |
| TX-07 | NR 045 **in cipher** under the day key: steer zero four zero for Dunkirk | – | Decode it, steer 040 | Encryption hides a message and proves who sent it |
| TX-08 | **NR 045 again**, same time, **in clear**, steer **140** | 3, 5 | Ignore | Tampering (man-in-the-middle) |

The binoculars teach checking through a second channel (the light vessel and
buoy only appear when you're on course), and identifying by several features
at once (WEFT on the aircraft).

### Aircraft

Five come over, one at a time. One due while another is still up waits until
the sky is clear; Tom's "Hear that?" lines go on `:overhead`, so they always
match what's in the sky.

| Sighting | Due | Aircraft | Side | What gives it away |
| --- | --- | --- | --- | --- |
| BN-05 | T+1:25 | Hawker Hurricane | Allied | Thick wing, rounded tips, radiator under the belly, roundels |
| BN-06 | T+3:45 | Messerschmitt Bf 109 | German | Like a Spitfire, but square-cut wingtips and black crosses |
| BN-02 | T+4:50 | Supermarine Spitfire | Allied | Elliptical wing, roundels |
| BN-07 | T+7:15 | Heinkel He 111 | German | Two engines, glazed nose, a bomber |
| BN-04 | T+8:00 | Junkers Ju 87 Stuka | German | Bent gull wing, fixed spatted wheels |

German ones, rightly called, can be reported on the telex.

## Editing the script (`dialogue.js`)

Every entry has the shape your prompt asked for:

```js
{ id: 'V-07', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7,
  trigger: { type: 'event', value: 'TX-02:read' },
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

**Telex entries** add `correctAction` (`'trust'` or `'reject'`), and
`newHeading` (true orders) or `lureHeading` plus `lure` (`'lured'` or
`'turnedBack'`) for false ones. `fails` and `concept` are notes for teachers.
`text` is written exactly like a file in `Telex Machine Demo/signals/`:
headers, a `---` rule, then the message.

**Sighting entries** (`SPOT`) have `sighting: { kind: 'mark', art, ahead, offset, w, h }`
with an `until` time for buoys, or `sighting: { kind: 'aircraft', aircraft: 'stuka' | 'spitfire' }`.

Keep backticks and `${` out of any text.

The queue rules (from your prompt): lines never overlap; event lines jump to
the front; time lines that wait more than 10 s are dropped unless critical;
telexes never go through the queue, so they're never dropped. A click while a
line types finishes the line, and a second click moves on. Space does the same.

The numbers that tune the game (tolerance, route length, how long to follow a
false order, reminder timings) are in `voyage` at the top of `dialogue.js`.

## What was added to the ship page

Only the hooks this layer needs. Without the Script, the helm runs exactly as
before (random signals and aircraft).

- `window.SHIP`: read the heading, position, whether the glasses are up or a
  slip is in hand. Hold the boat still. Turn off random telexes and aircraft
  and send chosen ones. Add or remove a mark on the water. Ask whether a point
  is in the binoculars' view. Open or close the rulebook.
- Events: `signalarrived`, `signalread`, `signalputdown` and `aircraftgone`,
  next to the existing `aircraftspotted` and `aircraftidentified`. The Script
  also listens for Seth's `telexverdict` and `aircraftreported`.
- `signalread` fires only for the slip in the machine, not for a page re-read
  off the cipher desk, and names the signal so a recon reply isn't mistaken
  for a story telex. `SHIP.slipWaiting` tells the Script a slip is still
  unread; `SHIP.closeDesk()` puts the desk away for the endings.
- Links to `script.css` and the five scripts.

## Test checklist

Use the debug panel. ×5 runs the voyage in under three minutes; **Jump** goes
straight to a time. The panel shows the ordered course, progress, the slip in
the machine, a fake being followed, and ✓ / ✗ for every telex and
sighting (BN-01 to BN-07). Aircraft fly at normal speed even when the clock is
sped up, so at ×5 an aircraft nobody looks at holds the others back.

Note: the debug speed-up runs the clock faster but the boat at normal speed.
Turns cost more in-game time at ×5, so check endings at ×1 or ×2.

**Intro**
- [ ] Title shows; *Begin* starts the intro. The boat doesn't move.
- [ ] Kent coast caption, then Hartley; I-03 and I-05 wait for a choice.
- [ ] Ramsgate caption at I-09. At I-13 the rulebook opens; clicking on closes it.
- [ ] I-18 starts the clock at 05:00 and the boat moves.

**Act 1**
- [ ] T+0:03 and T+0:08: Tom's two lines.
- [ ] T+0:15: TX-00 prints, Tom notices it (V-03); reading it gives V-04; 00 ✓.
- [ ] T+0:25: TX-K1, the day key (prints once TX-00 is put down). V-04b on reading. It lands in the cipher desk's key tray.
- [ ] Every slip shows "Is this signal genuine?" beside it; answering shows the clues and lesson.
- [ ] T+0:35: TX-01 (prints once TX-K1 is put down). Reading it gives V-05; steering 072 gives V-05b; 01 ✓.
- [ ] T+1:50: TX-02 from DOVRE. Reading gives V-07. Holding 072 for 20 s gives V-08 and 02 ✓.
- [ ] Again with steering 180 after reading: V-09 and 02 ✗; 30 s on 180 ends **Lured off course**.
- [ ] T+2:40–3:10 on course: the N. GOODWIN light vessel appears ahead; glasses on it gives V-12 (BN-01 ✓).
      Off course at the time: no vessel, V-13. Looking away: V-13b.

**Act 2**
- [ ] T+1:25: a Hurricane (V-18, V-19 as it comes over). *Allied* gives V-19a, *German* V-19b, letting it go V-19i.
- [ ] T+3:15: TX-03 prints in cipher (V-14). Decoded under the day key it reads "zero one five". Steer 015 (V-14b).
- [ ] T+3:45: a Bf 109 (V-19c). *German* gives V-19d, *Allied* V-19e; reporting it gives V-19g.
- [ ] T+4:00: TX-04. Steering 270 after reading gives V-17; 30 s ends **Turned back**. Ignoring it gives V-16.
- [ ] T+4:50: a Spitfire (V-19h, once the Bf 109 has gone). *Allied* gives V-20, *German* gives V-21, letting it go gives V-21b.
- [ ] T+5:15: TX-05, reading gives V-22; 05 ✓.
- [ ] T+5:40: TX-05b, the forged replacement key. V-22b on reading; *Suspect* gives V-22c, *Genuine* gives V-22d.
- [ ] T+6:00: TX-06 (NR 036 again): V-23 on reading; V-24 if ignored; steering 072 gives V-25.
- [ ] T+6:25: TX-06b in cipher under REPLACEMENT KEY (V-25b). Gibberish under the day key, reads under SEAGULL. Ignoring it gives V-25c; steering 110 gives V-25d.
- [ ] T+6:20–6:45: the KWINTE buoy ahead if on course (V-26 / V-26b / V-26c).

**Act 3**
- [ ] T+6:50: TX-07 prints in cipher (V-27). Decoded with the day key on the desk it reads "steer zero four zero"; with SEAGULL it's gibberish. Steer 040 (V-28).
- [ ] T+7:05: TX-08 (NR 045 again, in clear, 140): V-29 on reading; V-30 if ignored; steering 140 gives V-31.
- [ ] Identify the Stuka as German, lower the glasses and click *Report sighting* on the telex: V-34r, then Dover's reply prints (it waits if a slip is unread).
- [ ] T+7:15: a He 111 (V-31a). *German* gives V-31b, *Allied* V-31c; reporting it gives V-31e.
- [ ] T+7:40 smoke line; T+8:00 a Stuka (V-32b, V-33 / V-34 / V-34b); T+11:00 Tom's "two hours to go".
- [ ] T+8:45 and T+9:20: Tom's beach lines.

**Reminders**
- [ ] Leave a slip unread 20 s: R-01.
- [ ] 15 s off the ordered course (after 20 s grace for a new order): R-02; 40 s: R-03.

**Endings**
- [ ] Perfect steering: **You reached the beaches** around 13:30 with 12 of 12 and 7 of 7.
- [ ] Never steering: **Too late** at 18:00.
- [ ] Each ending's lines play, then the score card; *Play again* returns to a fresh title.
