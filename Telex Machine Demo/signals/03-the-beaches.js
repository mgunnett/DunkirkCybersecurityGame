/* UNLOCKS is not a header the machine knows, so it never reaches the
   paper — it arrives on the signal object as sig.unlocks for whatever
   you build next. Delete it if you'd rather keep puzzle state
   elsewhere. There's no fixed course to keep beside it: the course
   depends on where the boat is when the slip prints, and arrives as
   sig.plot.course once it has (../course.js). */

TELEX.signal(`
SERIAL:   NR 048
PRIORITY: IMMEDIATE
TIME:     1150Z/30 MAY 40
UNLOCKS:  04-air-attack.js
---
The eastern mole at Dunkirk is crowded with destroyers. Leave
it to them. Small craft are to work the beaches between
Malo-les-Bains and Bray-Dunes.

Next mark: {MARK}. {WHY}

{HELM}

The mark is {MINUTES} away at your speed. Off the beaches the
water shoals fast. If the shoal warning lights on the dash,
bear away to port, away from the shore.
`);
