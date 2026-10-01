# Telex — Dunkirk

A receiving teleprinter for the helm. The lamp flashes, the player presses
**Receive**, and the machine prints a slip of paper — too small to read.
Clicking the slip enlarges it. The red X puts it back.

Open `index.html` in a browser. No build step, no server, no dependencies,
no audio.

```
index.html          markup — the prop is one block you can lift out
telex.css           everything visual
telex.js            the machine — you shouldn't need to edit this
config.js           ship name, wrap width, how many slips to keep
course.js           the route to the beach, and the courses the signals give
signals/
  manifest.js       which signal files load, in what order
  01-sailing-orders.js
  02-route-x.js
  03-the-beaches.js
  04-air-attack.js
  05-homeward.js
  06-recall.js      not in the manifest — delivered mid-game instead
```

## Fitting it into the ship

Everything between the two comment rules in `index.html` is the prop. Lift
that block into the helm, load `telex.css` and `telex.js`, and size it from
a wrapper:

```css
.helm-panel { --telex-width: 300px; --telex-height: 380px; }
```

It defaults to 320 × 420 and shrinks to its container on narrow screens.
The enlarged sheet lives outside the machine so it can cover the whole
screen no matter how small the prop is — keep that `<div class="viewer">`
block wherever it can sit at the top of the stacking order.

No global keyboard shortcuts are bound except Escape, and that only while
the enlarged sheet is open, so nothing here will fight the steering
controls.

## How a signal reaches the player

`TELEX.incoming()` flashes the lamp. Pressing **Receive** prints one of the
loaded signal files at random, and won't hand out the same one twice in a
row. That's the ordinary path, and the operator panel's top button does it.

To force a particular signal instead, `TELEX.sendId('02-route-x')` — the
lamp flashes the same way, but that file jumps ahead of the random pick.

The tear bar above the console is clickable and clears the bay.

## Writing a signal

One file per slip. Headers, a `---` rule, then the message:

```js
TELEX.signal(`
SERIAL:   NR 014
PRIORITY: IMMEDIATE
TIME:     2212Z/29 MAY 40
---
Orders for Operation Dynamo. Proceed from Ramsgate inner
harbour at 2340 in company with tug Sun IV.

A blank line starts a new paragraph.
`);
```

Write the body as ordinary prose. The machine wraps it to `columns` in
`config.js`, sets it in upper case and puts the header block around it, so
you don't have to count characters. Every header is optional — `FROM`, `TO`
and the sign-off fall back to `config.js`.

Add the filename to `signals/manifest.js` and it joins the random pool.

Two characters to keep out of the text: a backtick, and a dollar sign
immediately followed by `{`. Both end the quoted block early.

### Headers

| Header | Does |
| --- | --- |
| `SERIAL` | message number in the header line |
| `PRIORITY` | ROUTINE / IMMEDIATE / MOST IMMEDIATE |
| `TIME` | time of origin |
| `FROM`, `TO` | override the defaults in `config.js` |
| `SIGN` | sign-off above the end mark; leave blank for none |
| `ID` | how `TELEX.sendId()` refers to it — defaults to the filename |
| `RAW` | `yes` keeps mixed case instead of upper-casing |

Any header the machine doesn't recognise is still parsed and handed to your
code. `03-the-beaches.js` carries `UNLOCKS: 04-air-attack.js`, which never
reaches the paper but arrives as `sig.unlocks`. Useful for keeping puzzle
data next to the clue it belongs to.

### Courses

Signals don't carry fixed courses. They carry marks that are filled in as
the slip prints, from where the boat is and which way she's heading:

| Mark | Prints as |
| --- | --- |
| `{HELM}` | the full helm order: *Turn 40 degrees to starboard. Put the wheel over to the right and hold it until the compass reads 062, then centre the wheel.* |
| `{COURSE}` | the course for the next mark, in three figures: *062* |
| `{MARK}` | the next mark's name: *the Kwinte Buoy* |
| `{MINUTES}` | roughly how long that leg takes: *3 minutes* |

The route is in `course.js`: a chain of named marks, in metres as the
ship's position indicator reads them. It zig-zags up the swept channel
(000, 339, 059, 355, then 062 for the beach) rather than running straight
at the goal. The last mark is the goal itself, and the ship passes its
real position in. Move a mark and every signal follows.

The ship hands signals out at random, so none is tied to a leg. Whichever
prints gives the leg the boat is on. Once she reaches a mark, or goes past
it, the next signal gives the next leg, from wherever she actually is. That
also corrects her if she has drifted. Opened on its own, this machine has
no boat to read, so each print assumes the last order was steered exactly
and moves on one leg. Printing from the operator panel walks you through
the whole route.

## Driving it from puzzle code

```js
TELEX.incoming()                  // flash the lamp; Receive picks at random
TELEX.sendId('02-route-x')        // flash the lamp for one specific signal
TELEX.sendFile('06-recall.js')    // load a file on demand and queue it
TELEX.send('SERIAL: NR 999\n---\nInline text, no file needed.')

TELEX.receive()                   // print now, without waiting for a click
TELEX.open(0)  TELEX.close()      // enlarge a slip from code
TELEX.tear()                      // clear the bay

TELEX.on('printend', sig => {     // 'alert' | 'printstart' | 'printend'
  if (sig.id === '03-the-beaches') openTheChartDrawer();
});                               // 'open' | 'close' | 'tear'

TELEX.get('03-the-beaches').unlocks  // '04-air-attack.js'
TELEX_COURSE.plot({ x, y, heading })  // the next leg: { course, turn, mark, minutes, ... }
TELEX.waiting()                      // is the lamp flashing?
```

The full list is commented at the bottom of `telex.js`.

## Before it goes in the helm

**Remove the operator panel.** Delete the `<details class="gm">` block from
`index.html`, or set `hideOperatorPanel: true` in `config.js`.

**Check how long a signal takes.** Print speed is fixed at 40 characters a
second in `telex.js`. With headers and rules, a signal of this length runs
to about 700 characters, so the machine clatters for roughly 17 seconds
before the slip is finished. That's a long beat if the player is waiting on
it and a good one if they're steering meanwhile. To shorten it, cut the
body rather than the speed — or drop `columns` in `config.js`, which
narrows the slip and trims the rules at top and bottom.

**Deal with the fonts.** `index.html` pulls Courier Prime and Oswald from
Google Fonts. If the machine will be offline, either download the two
families into the project and swap the `<link>` for a local `@font-face`,
or delete the `<link>` — the fallbacks are Courier New and Arial, which
every machine has and which still read correctly.

## If nothing prints

The machine reports its own faults on the paper. A file named in the
manifest that isn't on disk shows as a red button on the operator panel,
and pressing it prints the path it couldn't find. An empty bay tells you
which file to look in.

Filenames are case-sensitive on Linux and macOS but not on Windows, so a
manifest entry that works on your laptop can fail on the installed machine.
Match the case exactly.
