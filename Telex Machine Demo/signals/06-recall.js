/* The last leg, in to the beach. The full game sends it once the boat
   reaches the Zuydcoote Pass, and soon after sends a tampered copy
   of it: same number, same time, a different course. */

TELEX.signal(`
SERIAL:   NR 097
PRIORITY: MOST IMMEDIATE
TIME:     0902Z/31 MAY 40
---
Dynamo closing. The last lift from the beaches is at 0300
tomorrow. Small craft still on passage are to make this their
last run in, then come home with whatever troops they have
embarked.

Next mark: {MARK}. {WHY}

{HELM}

The mark is {MINUTES} away at your speed. Do not wait for
stragglers.
`);
