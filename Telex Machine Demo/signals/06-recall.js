/* Deliberately not listed in manifest.js. It doesn't exist as far as
   the machine is concerned until your puzzle code calls

       TELEX.sendFile('06-recall.js')

   at which point it loads, joins the operator panel and the lamp
   lights. Use this for signals the players have to earn. */

TELEX.signal(`
SERIAL:   NR 097
PRIORITY: MOST IMMEDIATE
TIME:     0902Z/31 MAY 40
---
Dynamo closing. The last lift from the beaches is at 0300
tomorrow. Small craft still on passage are to make this
their last run in, then withdraw with whatever troops
they have embarked.

{HELM}

Hold {COURSE} for about {MINUTES} to reach {MARK}. Do not
wait for stragglers. Do not return for a second trip.
`);
