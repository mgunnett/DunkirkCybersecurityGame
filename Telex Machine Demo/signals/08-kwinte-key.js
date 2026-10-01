/* The first half of a cipher pair. TYPE: key prints as a key slip, and
   INDICATOR ties it to 09-kwinte-cipher.js. The
   cipher can't come in until this one has.

   CIPHER and KEYWORD never reach the paper. They tell the machine how to
   encipher the other half, so the body here is what the players read —
   write it as plainly or as cryptically as the puzzle needs. */

TELEX.signal(`
TYPE:      key
INDICATOR: KWINTE
CIPHER:    vigenere
KEYWORD:   DYNAMO
SERIAL:    NR 057
PRIORITY:  IMMEDIATE
TIME:      1515Z/30 MAY 40
---
Traffic under indicator KWINTE is in Vigenere table.
Keyword is the name of this operation.

Retain this slip. Do not transmit the keyword in clear.
`);
