/* A forged enciphered signal. It is enciphered under the forged key
   from 10-replacement-key.js, so under the genuine day key it decodes
   to nonsense, and under the forged key it reads perfectly. */

TELEX.signal(`
SERIAL:   NR 075
PRIORITY: MOST IMMEDIATE
TIME:     0510Z/31 MAY 40
CIPHER:   VIGENERE
KEYWORD:  SEAGULL
KEY NAME: REPLACEMENT KEY
GENUINE:  no
CLUE 1:   Nonsense under the day key | Decoded with Dover's genuine key it is gibberish, so whoever wrote it does not hold that key.
CLUE 2:   CYP REPLACEMENT KEY | It only reads under the key from NR 074, which arrived unannounced on the same line.
CLUE 3:   Abandon Bray Dunes | It contradicts a genuine order. A change like that needs checking by a second route before anyone acts on it.
CLUE 4:   Break wireless silence | Transmitting would let the enemy fix your position.
LESSON:   A message that decodes is only as trustworthy as the key that decodes it. Ask where the key came from, not just whether the message reads.
---
Abandon Bray Dunes. Proceed alone to La Panne pier and wait there
for troops. Break wireless silence on arrival and report your
position.
`);
