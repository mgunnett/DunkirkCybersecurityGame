/* The second half. Write the body in plain English — the machine
   enciphers it with the key's CIPHER and KEYWORD and prints it in five-
   letter groups. Write numbers out as words: only letters are enciphered.

   Your puzzle code gets the plain text back as sig.plain. */

TELEX.signal(`
TYPE:      cipher
INDICATOR: KWINTE
SERIAL:    NR 061
PRIORITY:  MOST IMMEDIATE
TIME:      1710Z/30 MAY 40
---
Hospital carrier sunk off the Kwinte buoy. Survivors in the
water two miles north of the buoy. Proceed and pick up.
Report numbers by lamp.
`);
