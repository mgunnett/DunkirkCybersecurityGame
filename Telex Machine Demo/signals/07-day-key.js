/* A KEY signal. KEY: is the keyword itself; the machine prints it as
   a key group under the message, and the cipher desk files it in the
   player's key tray. KEY NAME is how the desk and the enciphered
   signals refer to it.

   GENUINE, CLUE n and LESSON drive the "is this genuine?" drill on
   the cipher desk. A clue is  quote | why : the quote is something
   the player can point to on the slip, the why is what it tells them. */

TELEX.signal(`
SERIAL:   NR 071
PRIORITY: IMMEDIATE
TIME:     0001Z/31 MAY 40
KEY:      DYNAMO
KEY NAME: DAY KEY 31 MAY
GENUINE:  yes
CLUE 1:   FM V.A. DOVER (DYNAMO) | The station that sends all your orders, spelled correctly, with the next serial in the run.
CLUE 2:   Valid for traffic dated 31 May only | A key with a fixed lifetime limits the damage if it is captured. Keys change on a schedule, not because a message says so.
CLUE 3:   It asks you for nothing | A genuine key signal hands something over. It never asks you to send a secret back.
LESSON:   The key travels on its own, apart from the messages it unlocks. Whoever holds it can read your traffic and write traffic that looks as if it came from Dover, so guard it like the ship's papers.
---
Day key for enciphered traffic. Valid for traffic dated 31 May
only. Signals marked DAY KEY 31 MAY are to be read with the key
group below. Burn this slip at 2359. Do not repeat this key by
any means.
`);
