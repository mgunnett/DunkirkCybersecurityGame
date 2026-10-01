/* UNLOCKS is not a header the machine knows, so it never reaches the
   paper — it arrives on the signal object as sig.unlocks for whatever
   you build next. Delete it if you'd rather keep puzzle state
   elsewhere. There's no fixed course to keep beside it: the course
   depends on where the boat is when the slip prints (../course.js). */

TELEX.signal(`
SERIAL:   NR 048
PRIORITY: IMMEDIATE
TIME:     1150Z/30 MAY 40
UNLOCKS:  04-air-attack.js
---
Small craft are to work the beaches between Malo-les-Bains
and Bray-Dunes. The mole is congested. Leave it to the
destroyers.

{HELM}

Hold {COURSE} for about {MINUTES} to reach {MARK}. On the
final run in, the smoke over Dunkirk is your landmark.
Anchor off in not less than two fathoms and ferry troops
out to the ships lying off.
`);
