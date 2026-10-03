/* A forged KEY signal. It still lands in the key tray. The player's
   job is to notice it shouldn't be trusted; judging it "suspect"
   marks it in the tray. */

TELEX.signal(`
SERIAL:   NR 074
PRIORITY: MOST IMMEDIATE
TIME:     0450Z/31 MAY 40
KEY:      SEAGULL
KEY NAME: REPLACEMENT KEY
SIGN:
GENUINE:  no
CLUE 1:   Previous key compromised | Keys change on a schedule and by a separate route. A key change announced on the same line as the orders is exactly what someone forging orders would send.
CLUE 2:   Discard the day key at once | It wants you to throw away the one thing that lets you tell real traffic from fake.
CLUE 3:   Do not confirm by lamp | Being told not to check is the strongest red flag of all. Genuine senders want you to verify them.
CLUE 4:   KEY GROUP SEAGULL | The new key arrives in clear and can't be checked against anything you already trust.
LESSON:   This is a key substitution attack. Get the victim to swap their key for yours and every forged message afterwards decodes perfectly. Only accept a new key through the route that delivered the old one, and confirm it before you use it.
---
Previous key compromised. Discard the day key at once and use the
replacement key below for all traffic from this signal on. Do not
confirm by lamp. The enemy is reading lamps.
`);
