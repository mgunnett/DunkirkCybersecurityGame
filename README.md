# Dunkirk Cybersecurity Game

A browser-based educational game that teaches the basics of cybersecurity
through the 1940 evacuation of Dunkirk (Operation Dynamo). The player
skippers a small civilian boat across the English Channel, steering by
teleprinter orders from Dover, while German forces send forged orders to
lead the boat into danger.

| | |
| --- | --- |
| **Genre** | Educational simulation / narrative puzzle |
| **Platform** | Desktop web browser |
| **Play time** | About 13 minutes (1 real second = 1 in-game minute, 05:00 to 18:00) |
| **Audience** | Students learning introductory cybersecurity |
| **Tech** | Plain HTML, CSS and JavaScript. No build step, server or dependencies |
| **Repository** | [github.com/mgunnett/DunkirkCybersecurityGame](https://github.com/mgunnett/DunkirkCybersecurityGame) |

---

## Contents

1. [Story](#story)
2. [Gameplay](#gameplay)
3. [Learning objectives](#learning-objectives)
4. [Getting started](#getting-started)
5. [Project structure](#project-structure)
6. [Quality goals (Week 6)](#quality-goals-week-6)
7. [Acceptance requirements](#acceptance-requirements)
8. [Acceptance criteria](#acceptance-criteria)
9. [Known issues](#known-issues)
10. [Testing](#testing)
11. [Documentation](#documentation)

---

## Story

You are a British citizen living on the coast of the English Channel. One
day you receive a strange call from the British Ministry of Shipping, asking
to collect your motorboat. As an experienced boatman, you agree, on the
condition that you sail your own vessel. The Ministry agrees, though
hesitantly, and explains that your boat will cross the Channel to the beaches
of Dunkirk, where thousands of Allied soldiers are waiting to be rescued from
the advancing German forces. With your boating and navigation skills, you set
sail from Ramsgate for Dunkirk, where the soldiers await your rescue.

---

## Gameplay

### Original design concept

- The journey from Ramsgate, UK, to the beach at Dunkirk took about 10 hours.
  Turning each minute into one second gives a game of about 10 minutes.
- The player receives messages detailing the route to travel, but some of them
  have been spoofed by German forces. These try to steer the player in the
  wrong direction with false information, and it is up to the player to find
  the genuine Allied messages and follow the correct course.
- The player has no knowledge of the destination, so they rely on the messages
  and steer the boat by a given number of degrees.
- The player has a rulebook that guides them in telling legitimate messages
  from fakes.

### As built

The current build extends the concept to a 13-minute voyage (05:00 to the
18:00 deadline), so there is time to decode orders sent in cipher.

| System | What the player does |
| --- | --- |
| [**Helm and compass**](Ship%20Functionality%20Demo/shipbuild-demo.html) | Steers by compass heading. The boat moves at constant speed. |
| [**Telex**](Telex%20Machine%20Demo/README.md) | Receives 15 scripted signals: 9 genuine and 6 forged. Each genuine course order is worked out live from where the boat is ([courses](Telex%20Machine%20Demo/README.md#courses)). |
| [**Rulebook**](Rulebook%20Demo/README.md) | Learns the [five checks](Rulebook%20Demo/pages/03-the-five-checks.js) (sender, recipient, number, time, sense of the order), [ciphers](Rulebook%20Demo/pages/04a-signals-in-cipher.js) and [aircraft recognition](Rulebook%20Demo/pages/04c-aircraft-recognition.js). |
| [**Cipher desk**](Telex%20Machine%20Demo/README.md#the-cipher-desk-and-security-drills) | Files every slip, stores keys, decodes enciphered orders and answers *"Is this signal genuine?"* for a debrief. |
| [**Binoculars**](Script/README.md#aircraft) | Confirms position by spotting the North Goodwin light vessel and the Kwinte buoy, and identifies five aircraft as German or Allied. |
| [**Dialogue**](Script/dialogue.js) | Crewmate Tom and a narrator react to the player's choices and give hints. |

**Endings:** reach the beach (win), run out of time at 18:00, or follow a
forged order for 30 seconds and be *lured off course* or *turned back*. Each
ending shows a score of telexes and sightings judged correctly. How each is
decided: [How a telex is judged](Script/README.md#how-a-telex-is-judged).

---

## Learning objectives

By the end of a playthrough, players should be able to:

1. **Authenticate a message** by checking its sender, recipient, serial number,
   time and whether the order makes sense.
   ([Rulebook: The Five Checks](Rulebook%20Demo/pages/03-the-five-checks.js))
2. **Recognize spoofing**: a lookalike sender.
   ([Rulebook: Signs of a False Signal](Rulebook%20Demo/pages/04-signs-of-a-false-signal.js))
3. **Recognize phishing and social engineering**: urgency, authority and "no
   time to check".
   ([Rulebook: Signs of a False Signal](Rulebook%20Demo/pages/04-signs-of-a-false-signal.js))
4. **Recognize replay attacks**: an old genuine message sent again.
   ([Rulebook: Reading a Signal](Rulebook%20Demo/pages/02-reading-a-signal.js))
5. **Recognize tampering**: a genuine message altered in transit.
   ([Rulebook: Signs of a False Signal](Rulebook%20Demo/pages/04-signs-of-a-false-signal.js))
6. **Explain encryption and key management**: why keys travel separately, and
   how a forged key change is used to slip in forged orders.
   ([Rulebook: Signals in Cipher](Rulebook%20Demo/pages/04a-signals-in-cipher.js),
   [Decoding a Signal](Rulebook%20Demo/pages/04b-decoding-a-signal.js))
7. **Verify through a second channel**: checking orders against landmarks, and
   identifying aircraft by several features at once (WEFT).
   ([Route marks](Script/README.md#route),
   [Rulebook: Aircraft Recognition](Rulebook%20Demo/pages/04c-aircraft-recognition.js))

Which telex teaches which idea: [answer key](Script/README.md#answer-key).

---

## Getting started

**Requirements:** a modern desktop browser (Chrome, Edge, Firefox or Safari).
[Node.js](https://nodejs.org/) 18 or later is needed only to run the tests.

1. Clone the [repository](https://github.com/mgunnett/DunkirkCybersecurityGame).
2. Open [`Ship Functionality Demo/shipbuild-demo.html`](Ship%20Functionality%20Demo/shipbuild-demo.html) in a browser.
3. Press **Begin** on the title screen.

Add `?debug` to the address, or press <kbd>`</kbd>, for the
[debug panel](Script/game.js). It can speed the clock up, jump to a time, and
shows the state of every telex and sighting. Press <kbd>P</kbd> to
[pause](Script/README.md#pausing).

### Running with Docker

To put the game on a web server, the [`Dockerfile`](Dockerfile) packs it into
a small [nginx](https://nginx.org/) image. Nothing is compiled; nginx just
serves the game's files. You need [Docker](https://docs.docker.com/get-docker/)
installed.

```
docker build -t dunkirk-game .
docker run --rm -p 8080:8080 dunkirk-game
```

Then open <http://localhost:8080>, which goes straight to the ship. nginx
listens on the `PORT` environment variable (8080 by default), so hosts that
choose the port themselves work unchanged. The server settings are in
[`docker/default.conf.template`](docker/default.conf.template), and
[`.dockerignore`](.dockerignore) keeps the logs, tests and documents out of
the image.

---

## Project structure

| Folder | What's in it |
| --- | --- |
| [Ship Functionality Demo/](Ship%20Functionality%20Demo/) | The helm: wheel, compass, sea, binoculars. Start at [shipbuild-demo.html](Ship%20Functionality%20Demo/shipbuild-demo.html). |
| [Script/](Script/) | Story layer: [dialogue](Script/dialogue.js), [clock](Script/clock.js), [voyage logic](Script/voyage.js), [game flow and endings](Script/game.js) |
| [Telex Machine Demo/](Telex%20Machine%20Demo/) | Teleprinter ([telex.js](Telex%20Machine%20Demo/telex.js)), route ([course.js](Telex%20Machine%20Demo/course.js)), cipher desk ([decoder.js](Telex%20Machine%20Demo/decoder.js), [desk.js](Telex%20Machine%20Demo/desk.js)), [signal files](Telex%20Machine%20Demo/signals/) |
| [Rulebook Demo/](Rulebook%20Demo/) | The in-game rulebook, [one file per chapter](Rulebook%20Demo/pages/) |
| [WEFT Images/](WEFT%20Images/) | Aircraft artwork for identification |
| [tests/](tests/) | Unit tests ([edge-cases.test.js](tests/edge-cases.test.js)), run with Node's built-in test runner |
| [docker/](docker/) | Web server settings for the [Dockerfile](Dockerfile) |
| [Logs & Documentation/](Logs%20%26%20Documentation/) | ADR and burndown chart (see [Documentation](#documentation)) |

---

## Quality goals (Week 6)

The team measures the build against three quality characteristics.

| Characteristic | Measure | Example target |
| --- | --- | --- |
| **Functional Suitability** | User stories are implemented and adapted into the game. | Mimics the telex machine, boat, steering, binoculars and rulebook. |
| **Interaction Capability** | Easy to use and understand for the average user. | The client can pick up the game and quickly learn the rules and logic. |
| **Maintainability** | Easy access between team members and across sprints. | Code is simple to look up and explained, with the reasoning stated in comments or in supplementary GitHub commits. |

### Status against the [ADR1](Logs%20%26%20Documentation/ADR1.pdf) build

*Is this build passing compared to our ADR1 build?*

| Characteristic | Status | Notes |
| --- | --- | --- |
| Interaction Capability | Passing | |
| Maintainability | Passing | |
| Functional Suitability | Not yet | Game mechanics still need polish, and the game cycle needs finishing. |

---

## Acceptance requirements

The build is accepted when every **Must** requirement below is met and each
of its criteria passes. **Should** requirements are expected but don't block
acceptance. *Verified by* says how each one is checked: the automated unit
tests, or the manual checklist in [Script/README.md](Script/README.md#test-checklist).

| ID | Requirement | Priority | Verified by |
| --- | --- | --- | --- |
| [AR-01](#starting-the-game-ar-01) | As a player, I get a clear introduction to my role and goal before the voyage starts. | Must | [Manual](Script/README.md#test-checklist) |
| [AR-02](#telex-ar-02) | As a player, I receive my orders on a telex and can read each one. | Must | [Unit tests](tests/edge-cases.test.js), [manual](Script/README.md#test-checklist) |
| [AR-03](#judging-messages-ar-03-ar-04) | As a player, I can judge whether each message is genuine and get feedback on why. | Must | [Unit tests](tests/edge-cases.test.js), [manual](Script/README.md#test-checklist) |
| [AR-04](#judging-messages-ar-03-ar-04) | As a player, I steer by compass, and true orders give the course from where I actually am. | Must | [Unit tests](tests/edge-cases.test.js) |
| [AR-05](#cipher-desk-ar-05) | As a player, I can decode orders sent in cipher with the day key, and spot a forged key. | Must | [Unit tests](tests/edge-cases.test.js), [manual](Script/README.md#test-checklist) |
| [AR-06](#navigation-and-binoculars-ar-04-ar-06) | As a player, I can check my position and identify aircraft through the binoculars. | Must | [Unit tests](tests/edge-cases.test.js), [manual](Script/README.md#test-checklist) |
| [AR-07](#endings-and-pausing-ar-07-ar-08) | As a player, I reach an ending that matches my choices, with a score. | Must | [Unit tests](tests/edge-cases.test.js), [manual](Script/README.md#test-checklist) |
| [AR-08](#endings-and-pausing-ar-07-ar-08) | As a player, I can pause and resume without losing my place. | Should | [Manual](Script/README.md#test-checklist) |
| [AR-09](#non-functional-ar-09-ar-10-ar-11) | As a teacher, I can run the game in one class period with nothing to install. | Must | [Manual](Script/README.md#test-checklist) |
| [AR-10](#non-functional-ar-09-ar-10-ar-11) | As a developer, I can change story text and timings in one file, without touching game logic. | Should | Code review of [Script/dialogue.js](Script/dialogue.js) |
| [AR-11](#non-functional-ar-09-ar-10-ar-11) | The automated test suite passes in full. | Must | [Unit tests](tests/edge-cases.test.js) (see [Known issues](#known-issues)) |

---

## Acceptance criteria

Each group below gives the testable criteria for the requirement named in its
heading.

### Starting the game (AR-01)
Where: [Script/game.js](Script/game.js), intro lines in [Script/dialogue.js](Script/dialogue.js).
- [ ] The title screen appears on load, and the boat does not move.
- [ ] **Begin** starts the intro. Intro lines advance only on click.
- [ ] The rulebook opens during the briefing and closes when the player continues.
- [ ] The last intro line starts the clock at 05:00 and the boat begins to move.

### Telex (AR-02)
Where: [Telex Machine Demo/telex.js](Telex%20Machine%20Demo/telex.js), [course.js](Telex%20Machine%20Demo/course.js); see [How a signal reaches the player](Telex%20Machine%20Demo/README.md#how-a-signal-reaches-the-player).
- [ ] The lamp flashes when a signal arrives; the slip can be enlarged and read.
- [ ] Only one slip is in the machine at a time; the next waits until it is read and put down.
- [ ] Tom reminds the player about a slip left unread for 20 seconds.
- [ ] Each true course order gives the course to the next mark from the boat's current position.

### Judging messages (AR-03, AR-04)
Where: [Script/voyage.js](Script/voyage.js), [Telex Machine Demo/decoder.js](Telex%20Machine%20Demo/decoder.js); rules in [How a telex is judged](Script/README.md#how-a-telex-is-judged).
- [ ] Every slip offers **Genuine** / **Suspect**; answering shows the clues and the lesson.
- [ ] *Suspect* on a forged order counts as correct; *Genuine* on a forged order counts as wrong.
- [ ] A true course order counts as followed once read and its course is held for 3 seconds, or its mark is reached.
- [ ] A forged order read and not followed for 20 seconds counts as refused.
- [ ] Following a forged course for 5 seconds counts as falling for it, whatever was answered.

### Cipher desk (AR-05)
Where: [decoder.js](Telex%20Machine%20Demo/decoder.js), [desk.js](Telex%20Machine%20Demo/desk.js); see [The cipher desk](Script/README.md#the-cipher-desk).
- [ ] The day key (DYNAMO) is filed in the key tray when its signal is read.
- [ ] The enciphered true orders decode to sense under the day key only, with their figures written out in words.
- [ ] The forged order decodes only under the forged SEAGULL key.
- [ ] The tampered copy of the last order arrives in clear, with the same number and time and a changed course.

### Navigation and binoculars (AR-04, AR-06)
Where: [Ship Functionality Demo/shipbuild-demo.html](Ship%20Functionality%20Demo/shipbuild-demo.html), [Script/voyage.js](Script/voyage.js); see [Route](Script/README.md#route) and [Aircraft](Script/README.md#aircraft).
- [ ] The light vessel and the buoy sit on their route marks and count as spotted after half a second in view.
- [ ] Five aircraft come over one at a time; each asks *German or Allied?*
- [ ] A German aircraft identified correctly can be reported on the telex.
- [ ] Tom warns the player 15 and 40 seconds after going off course (after a 45-second grace period for a new order).

### Endings and pausing (AR-07, AR-08)
Where: [Script/voyage.js](Script/voyage.js), [Script/game.js](Script/game.js); see [Pausing](Script/README.md#pausing).
- [ ] Reaching the beach wins; a perfect run arrives at about 13:15 and scores 15 of 15 telexes and 7 of 7 sightings.
- [ ] The game ends at 18:00 if the boat has not arrived.
- [ ] Holding a forged course for 30 seconds ends the game (*lured* or *turned back*).
- [ ] The score card shows the time and both scores; **Play again** starts a fresh game.
- [ ] **P**, the pause button or switching tabs pauses the clock, the boat and the dialogue.

### Non-functional (AR-09, AR-10, AR-11)
Where: [Getting started](#getting-started), [Script/dialogue.js](Script/dialogue.js), [tests/](tests/).
- [ ] Runs by opening an [HTML file](Ship%20Functionality%20Demo/shipbuild-demo.html), with no install, server or network connection.
- [ ] A full playthrough fits in a single class period.
- [ ] Dates, places, vessels and aircraft fit May 1940.
- [ ] All story text and tuning values live in [`Script/dialogue.js`](Script/dialogue.js), editable without touching game logic ([editing guide](Script/README.md#editing-the-script-dialoguejs)).
- [ ] `node --test tests/edge-cases.test.js` reports no failures ([test file](tests/edge-cases.test.js)).

---

## Known issues

These are the open problems in the current build on `main`. As of
23 October 2026, all 77 unit tests pass, and [CI](.github/workflows/ci.yml)
runs them on every push and pull request.

| # | Issue | Impact | Affects |
| --- | --- | --- | --- |
| 1 | **Functional Suitability is not yet passing** against the [ADR1](Logs%20%26%20Documentation/ADR1.pdf) build (see [Quality goals](#quality-goals-week-6)). Game mechanics still need polish, and the game cycle needs finishing. | Medium | [AR-01 to AR-07](#acceptance-requirements) |
| 2 | **The merged build has not had a full manual play-through.** Avery's dynamic route and the cipher-desk story were combined in [pull request #22](https://github.com/mgunnett/DunkirkCybersecurityGame/pull/22). The unit tests and a scripted full-voyage simulation pass (a perfect run wins at 13:13 with 15 of 15 telexes and 7 of 7 sightings), but the [manual checklist](Script/README.md#test-checklist) has not been run in a browser since. | Medium until checked | [All](#acceptance-requirements) |
| 3 | **`node --test tests/` fails on some setups.** On Node 22 for Windows, passing the folder reports a single failure without running the tests. Name the file instead: `node --test tests/edge-cases.test.js` (see [Testing](#testing)). | Low: tooling only | [AR-11](#non-functional-ar-09-ar-10-ar-11) |
| 4 | **Debug speed-up only speeds the clock.** At ×5 the boat and the aircraft still move at normal speed, so turns cost more in-game time and an aircraft nobody looks at holds the others back. **Jump** only moves the clock; orders waiting for the boat to reach a mark still wait. Check timings and endings at ×1. ([debug panel](Script/game.js)) | Low: debug only | — |

---

## Testing

From the repository root:

```bash
node --test tests/edge-cases.test.js
```

The tests in [tests/edge-cases.test.js](tests/edge-cases.test.js) load the
real game code into a sandbox with a simulated ship, and check the
[clock](Script/clock.js), [telex parsing and the cipher](Telex%20Machine%20Demo/telex.js),
the [route](Telex%20Machine%20Demo/course.js) and the
[voyage rules](Script/voyage.js). They use
[Node's built-in test runner](https://nodejs.org/api/test.html), so nothing
needs to be installed.

For a full manual pass, follow the scene-by-scene checklist in
[Script/README.md](Script/README.md#test-checklist).

---

## Documentation

| Document | Contents |
| --- | --- |
| [Script/README.md](Script/README.md) | Story flow, judging rules, answer key, script editing guide, test checklist |
| [Telex Machine Demo/README.md](Telex%20Machine%20Demo/README.md) | Teleprinter, signal file format, route and courses, cipher desk |
| [Rulebook Demo/README.md](Rulebook%20Demo/README.md) | Rulebook structure and how to write chapters |
| [ADR1.pdf](Logs%20%26%20Documentation/ADR1.pdf) | Architecture decision record |
| [Burndown Chart.pdf](Logs%20%26%20Documentation/Burndown%20Chart.pdf) | Sprint burndown chart |
