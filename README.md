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
| **Helm and compass** | Steers by compass heading. The boat moves at constant speed. |
| **Telex** | Receives 15 scripted signals: 9 genuine and 6 forged. Each genuine course order is worked out live from where the boat is. |
| **Rulebook** | Learns the five checks (sender, recipient, number, time, sense of the order), ciphers and aircraft recognition. |
| **Cipher desk** | Files every slip, stores keys, decodes enciphered orders and answers *"Is this signal genuine?"* for a debrief. |
| **Binoculars** | Confirms position by spotting the North Goodwin light vessel and the Kwinte buoy, and identifies five aircraft as German or Allied. |
| **Dialogue** | Crewmate Tom and a narrator react to the player's choices and give hints. |

**Endings:** reach the beach (win), run out of time at 18:00, or follow a
forged order for 30 seconds and be *lured off course* or *turned back*. Each
ending shows a score of telexes and sightings judged correctly.

---

## Learning objectives

By the end of a playthrough, players should be able to:

1. **Authenticate a message** by checking its sender, recipient, serial number,
   time and whether the order makes sense.
2. **Recognize spoofing**: a lookalike sender.
3. **Recognize phishing and social engineering**: urgency, authority and "no
   time to check".
4. **Recognize replay attacks**: an old genuine message sent again.
5. **Recognize tampering**: a genuine message altered in transit.
6. **Explain encryption and key management**: why keys travel separately, and
   how a forged key change is used to slip in forged orders.
7. **Verify through a second channel**: checking orders against landmarks, and
   identifying aircraft by several features at once (WEFT).

---

## Getting started

**Requirements:** a modern desktop browser (Chrome, Edge, Firefox or Safari).
[Node.js](https://nodejs.org/) 18 or later is needed only to run the tests.

1. Clone the repository.
2. Open `Ship Functionality Demo/shipbuild-demo.html` in a browser.
3. Press **Begin** on the title screen.

Add `?debug` to the address, or press <kbd>`</kbd>, for the debug panel. It can
speed the clock up, jump to a time, and shows the state of every telex and
sighting. Press <kbd>P</kbd> to pause.

---

## Project structure

```
DunkirkCybersecurityGame/
├── Ship Functionality Demo/   The helm: wheel, compass, sea, binoculars (start here)
├── Script/                    Story layer: dialogue, clock, voyage logic, endings
├── Telex Machine Demo/        Teleprinter, route (course.js), cipher desk, signal files
├── Rulebook Demo/             The in-game rulebook, one file per chapter
├── WEFT Images/               Aircraft artwork for identification
├── tests/                     Unit tests (Node's built-in test runner)
├── Logs & Documentation/      ADR, burndown chart, AI interaction log
└── AILog(Seth).pdf            AI usage log
```

---

## Quality goals (Week 6)

The team measures the build against three quality characteristics.

| Characteristic | Measure | Example target |
| --- | --- | --- |
| **Functional Suitability** | User stories are implemented and adapted into the game. | Mimics the telex machine, boat, steering, binoculars and rulebook. |
| **Interaction Capability** | Easy to use and understand for the average user. | The client can pick up the game and quickly learn the rules and logic. |
| **Maintainability** | Easy access between team members and across sprints. | Code is simple to look up and explained, with the reasoning stated in comments or in supplementary GitHub commits. |

### Status against the ADR1 build

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
| AR-01 | As a player, I get a clear introduction to my role and goal before the voyage starts. | Must | Manual |
| AR-02 | As a player, I receive my orders on a telex and can read each one. | Must | Unit tests, manual |
| AR-03 | As a player, I can judge whether each message is genuine and get feedback on why. | Must | Unit tests, manual |
| AR-04 | As a player, I steer by compass, and true orders give the course from where I actually am. | Must | Unit tests |
| AR-05 | As a player, I can decode orders sent in cipher with the day key, and spot a forged key. | Must | Unit tests, manual |
| AR-06 | As a player, I can check my position and identify aircraft through the binoculars. | Must | Unit tests, manual |
| AR-07 | As a player, I reach an ending that matches my choices, with a score. | Must | Unit tests, manual |
| AR-08 | As a player, I can pause and resume without losing my place. | Should | Manual |
| AR-09 | As a teacher, I can run the game in one class period with nothing to install. | Must | Manual |
| AR-10 | As a developer, I can change story text and timings in one file, without touching game logic. | Should | Code review |
| AR-11 | The automated test suite passes in full. | Must | Unit tests (see [Known issues](#known-issues)) |

---

## Acceptance criteria

Each group below gives the testable criteria for the requirement named in its
heading.

### Starting the game (AR-01)
- [ ] The title screen appears on load, and the boat does not move.
- [ ] **Begin** starts the intro. Intro lines advance only on click.
- [ ] The rulebook opens during the briefing and closes when the player continues.
- [ ] The last intro line starts the clock at 05:00 and the boat begins to move.

### Telex (AR-02)
- [ ] The lamp flashes when a signal arrives; the slip can be enlarged and read.
- [ ] Only one slip is in the machine at a time; the next waits until it is read and put down.
- [ ] Tom reminds the player about a slip left unread for 20 seconds.
- [ ] Each true course order gives the course to the next mark from the boat's current position.

### Judging messages (AR-03, AR-04)
- [ ] Every slip offers **Genuine** / **Suspect**; answering shows the clues and the lesson.
- [ ] *Suspect* on a forged order counts as correct; *Genuine* on a forged order counts as wrong.
- [ ] A true course order counts as followed once read and its course is held for 3 seconds, or its mark is reached.
- [ ] A forged order read and not followed for 20 seconds counts as refused.
- [ ] Following a forged course for 5 seconds counts as falling for it, whatever was answered.

### Cipher desk (AR-05)
- [ ] The day key (DYNAMO) is filed in the key tray when its signal is read.
- [ ] The enciphered true orders decode to sense under the day key only, with their figures written out in words.
- [ ] The forged order decodes only under the forged SEAGULL key.
- [ ] The tampered copy of the last order arrives in clear, with the same number and time and a changed course.

### Navigation and binoculars (AR-04, AR-06)
- [ ] The light vessel and the buoy sit on their route marks and count as spotted after half a second in view.
- [ ] Five aircraft come over one at a time; each asks *German or Allied?*
- [ ] A German aircraft identified correctly can be reported on the telex.
- [ ] Tom warns the player 15 and 40 seconds after going off course (after a 45-second grace period for a new order).

### Endings and pausing (AR-07, AR-08)
- [ ] Reaching the beach wins; a perfect run arrives at about 13:15 and scores 15 of 15 telexes and 7 of 7 sightings.
- [ ] The game ends at 18:00 if the boat has not arrived.
- [ ] Holding a forged course for 30 seconds ends the game (*lured* or *turned back*).
- [ ] The score card shows the time and both scores; **Play again** starts a fresh game.
- [ ] **P**, the pause button or switching tabs pauses the clock, the boat and the dialogue.

### Non-functional (AR-09, AR-10, AR-11)
- [ ] Runs by opening an HTML file, with no install, server or network connection.
- [ ] A full playthrough fits in a single class period.
- [ ] Dates, places, vessels and aircraft fit May 1940.
- [ ] All story text and tuning values live in `Script/dialogue.js`, editable without touching game logic.
- [ ] `node --test tests/edge-cases.test.js` reports no failures.

---

## Known issues

These are the open problems in the current build on `main`. As of
3 October 2026, 72 of the 77 unit tests pass; the 5 failures are explained
below.

| # | Issue | Impact | Affects |
| --- | --- | --- | --- |
| 1 | **The lure ending fires one second early.** When a player follows a forged course, the 5 seconds it takes to count as "followed" are carried into the 30-second lure timer, so the game ends after 29 seconds instead of 30. Failing test: *false order: holding its course 30 s ends the game, 29 s does not*. | Low: the ending is one second early. | AR-07 |
| 2 | **Badly written script times are accepted.** `Clock.parse` reads `T+3:60` and `T+3:150` without an error, so a typo in `Script/dialogue.js` silently becomes a different time. Failing test: *Clock.parse: seconds must be 00-59 and nothing may trail*. | Low: only affects writers editing the script. | AR-10 |
| 3 | **The clock can run backwards on a negative frame.** `Clock.tick` subtracts time if it is given a negative step. The game never does this in normal play. Failing test: *Clock.tick: a zero or negative frame never runs the clock backwards*. | Very low: defensive check only. | AR-11 |
| 4 | **Two aircraft tests are out of date.** The game now says `:overhead` as each aircraft comes over, which the tests don't expect. The game behaves correctly; the tests need updating. Failing tests: *aircraft: identified once…* and *aircraft: flying past unidentified…*. | None in play. | AR-11 |
| 5 | **Functional Suitability is not yet passing** against the ADR1 build (see [Quality goals](#quality-goals-week-6)). Game mechanics still need polish, and the game cycle needs finishing. | Medium | AR-01 to AR-07 |
| 6 | **The merged build has not had a full manual play-through.** Avery's dynamic route and the cipher-desk story were combined in pull request #22. The unit tests and a scripted full-voyage simulation pass (a perfect run wins at 13:13 with 15 of 15 telexes and 7 of 7 sightings), but the manual checklist has not been run in a browser since. | Medium until checked | All |
| 7 | **`node --test tests/` fails on some setups.** On Node 22 for Windows, passing the folder reports a single failure without running the tests. Name the file instead: `node --test tests/edge-cases.test.js`. | Low: tooling only | AR-11 |
| 8 | **Debug speed-up only speeds the clock.** At ×5 the boat and the aircraft still move at normal speed, so turns cost more in-game time and an aircraft nobody looks at holds the others back. **Jump** only moves the clock; orders waiting for the boat to reach a mark still wait. Check timings and endings at ×1. | Low: debug only | — |

---

## Testing

From the repository root:

```bash
node --test tests/edge-cases.test.js
```

The tests load the real game code into a sandbox with a simulated ship, and
check the clock, telex parsing, the cipher, the route and the voyage rules.
Nothing needs to be installed.

For a full manual pass, follow the scene-by-scene checklist in
[Script/README.md](Script/README.md#test-checklist).

---

## Documentation

| Document | Contents |
| --- | --- |
| [Script/README.md](Script/README.md) | Story flow, judging rules, answer key, script editing guide, test checklist |
| [Telex Machine Demo/README.md](Telex%20Machine%20Demo/README.md) | Teleprinter, signal file format, route and courses, cipher desk |
| [Rulebook Demo/README.md](Rulebook%20Demo/README.md) | Rulebook structure and how to write chapters |
| [Logs & Documentation/](Logs%20%26%20Documentation/) | Architecture decision record (ADR1), burndown chart, AI interaction log |
| [AILog(Seth).pdf](AILog(Seth).pdf) | AI usage log |
