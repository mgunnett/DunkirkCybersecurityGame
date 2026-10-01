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
desk.js, desk.css   the cipher desk: every read telegram is filed here
decoder.js, decoder.css
                    the desk's tools beside the enlarged sheet: keys,
                    decoding, genuine-or-forged drills
config.js           ship name, wrap width, how many slips to keep
signals/
  manifest.js       which signal files load, in what order
  01-sailing-orders.js
  02-route-x.js
  03-the-beaches.js
  04-air-attack.js
  05-homeward.js
  06-recall.js      not in the manifest — delivered mid-game instead
  07 … 11           the security drill — see "The cipher desk" below
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
code. `03-the-beaches.js` carries `ANSWER: 190`, which never reaches the
paper but arrives as `sig.answer`. Useful for keeping a puzzle's solution
next to the clue that states it.

## The cipher desk and security drills

### The desk

The **Cipher desk** button (bottom right on the demo page) opens the desk
at any time. Once a slip in the bay has been read and put down, it's taken
out of the machine and filed on the desk as a page, so the bay only ever
holds unread traffic.

- **Filter.** *All*, *Cipher* (enciphered messages and keys) or *Plain*
  (messages sent in clear), each with a count.
- **Keys stay with their messages.** An enciphered message is clipped to
  the key whose `KEY NAME` it carries as soon as both have come in. A
  clipped key sits behind its message instead of lying loose, and reading
  the message shows the key telegram alongside it. To re-clip by hand,
  drag a loose key onto a cipher message, or pull the key out from behind
  its message to unclip it. Choosing a key in the decoder's slot clips
  it too.
- **Arrange.** Drag pages anywhere. The desk scrolls when a page is
  carried to its edge. With a page focused, the arrow keys move it (Shift
  for bigger steps) and Enter reads it. **Tidy** lays the visible pages
  out in columns again.
- Each page is labelled with its serial, its type and how much has been
  decoded, and stamped *Genuine* or *Suspect* once the player has judged it.
- **Stacks.** Plain telegrams that are the same go on one pile with a
  count: the same signal received again, or signals sharing a `STACK`
  header (`STACK: Recon reports`, or `stack:` on a signal object made in
  code, as the helm's sighting replies are). Reading a stack reads the
  whole pile, newest first. Keys and enciphered messages never stack,
  since each one is clipped to its own key.

The button and the desk are their own block in `index.html`, outside the
prop. In the helm, put the button wherever it suits and drop its
`position: fixed` rules in `desk.css`. `TELEX.desk.open()` and
`TELEX.desk.close()` do the same from code, and `TELEX.desk.pages()` lists
what has been filed.

### The tools beside the sheet

`decoder.js` and `decoder.css` add the desk's tools beside the enlarged
sheet. They only appear for signals that carry the headers below. Plain
signals open exactly as before.

**Keys travel separately from messages.** A key is its own signal. When it
prints it's filed in the player's key tray, and the machine prints the
key group under the message.

```js
TELEX.signal(`
SERIAL:   NR 071
KEY:      DYNAMO
KEY NAME: DAY KEY 31 MAY
---
Day key for enciphered traffic dated 31 May.
`);
```

**Enciphered messages.** Write the body in plain English. The machine
enciphers it (Vigenère, letters only) as it prints, and the keyword never
reaches the paper. The `CYP` line on the slip tells the player which key
to use.

```js
CIPHER:   VIGENERE
KEYWORD:  DYNAMO
KEY NAME: DAY KEY 31 MAY
```

On the desk the player drags a key from the tray into the slot (or
clicks it), then decodes the punched tape. Clicking a word decodes that
word, and one drag from the first letter to the last decodes the whole
tape. Keyboard: Tab to the tape, arrow keys, Shift to extend, Enter to
decode. Decoding with the wrong key gives nonsense, and that's the point.
A forgery enciphered under some other key won't read under the genuine one.

The decoding is built to these criteria:

- **Clicks only.** No step needs typing: a key goes in by drag or click,
  the tape decodes by click or drag, and the verdict is two buttons.
- **Under a minute.** With its key already clipped, an order decodes in
  two actions: click the slip, then drag across the tape.
- **Right decode, true instruction. Wrong decode, a way out.**
  - With the right key, a fully decoded tape sets the order out under
    "Decoded. The signal reads:" and fires a `telexdecoded` event on
    `document` (`{ signal, key, text }`) for the game to act on.
  - With the wrong key, five letters of nonsense bring up "This tape
    doesn't read" with two buttons. *Clear the tape and try another
    key* starts over. *Ask the signals officer* puts in the key the CYP
    line names, or says that key hasn't come in and the signal should be
    treated with suspicion.
  - Whatever happened on the tape, the debrief after the verdict shows
    what it really says.

**Is it genuine?** Any signal, enciphered or in clear, can ask the player
to judge it. After they answer, the desk explains what gave it away.

| Header | Does |
| --- | --- |
| `GENUINE` | `yes` or `no`. Asks the player "genuine or suspect?" |
| `CLUE 1`, `CLUE 2`, … | `quote \| why`. Something on the slip, and what it tells you. Listed as red flags for forgeries, or "why it checks out" for genuine signals |
| `LESSON` | the takeaway, shown last |

Each verdict is announced as a `telexverdict` event on `document`, with
`{ signal, genuine, choice, correct }` as its detail, and
`TELEX.desk.verdicts()` lists them all.

The drill in `signals/` runs 07 to 11:

| File | What it teaches |
| --- | --- |
| `07-day-key.js` | genuine key: it hands a secret over and never asks for one |
| `08-bray-dunes.js` | genuine order, enciphered: decoding under your key proves the sender |
| `09-fuel-request.js` | phishing in clear: lookalike sender, deadline, asks for the key |
| `10-replacement-key.js` | forged key: "discard your key, use this one, don't check" |
| `11-la-panne.js` | forged order under the forged key: nonsense under the real one |

To send a key and its message as a pair, force them from the operator
panel one after the other. The lamp stays lit until both have printed.
The panel tags key and cipher signals, but never says which are forged.

The helm in `Ship Functionality Demo` loads `desk.js`, `desk.css`,
`decoder.js` and `decoder.css` from this folder. Once a slip has been
read and put down, it comes off the teleprinter and goes onto the desk,
and the player can read it again from there. Every signal in the manifest
is in the helm's random pick, drill signals included. When the pick is an
enciphered signal whose key hasn't come in yet, the helm sends the key
first. The decoding tools open beside the helm's reading sheet, just as
they do here, and the helm's sighting replies stack on the desk as
*Recon reports*.

The desk and the decoder only need these from whatever `window.TELEX`
they find: `on('printend' | 'open' | 'close', fn)`, `take(sig)`,
`open(paper)`, `truthy`, and `cipher.letters / isEnciphered / encipher /
decipher / lines`, plus `isReading()` if the page has its own reading
sheet. The helm provides them at the bottom of its teleprinter section,
along with its own copy of the cipher.

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

TELEX.get('03-the-beaches').answer   // '190'
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
