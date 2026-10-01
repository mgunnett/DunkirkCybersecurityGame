/* An enciphered signal. Write the body in plain English: the machine
   enciphers it with KEYWORD as it prints, and the keyword never
   reaches the paper. The player has to decode it on the cipher desk
   with a key from their tray. KEY NAME is printed on the CYP line so
   they know which key to reach for. */

TELEX.signal(`
SERIAL:   NR 072
PRIORITY: IMMEDIATE
TIME:     0415Z/31 MAY 40
CIPHER:   VIGENERE
KEYWORD:  DYNAMO
KEY NAME: DAY KEY 31 MAY
GENUINE:  yes
CLUE 1:   Reads plainly under the day key | Only someone holding Dover's key could write a message that decodes to sense with it. The cipher proves who sent it as well as hiding what it says.
CLUE 2:   Keep wireless silent | The order fits standing instructions: no wireless, report by lamp, and no request for anything secret.
CLUE 3:   NR 072 | The serial follows straight on from the day key, NR 071.
LESSON:   Encryption does two jobs. It hides a message from the enemy, and it shows the message came from someone who holds the key. A signal that decodes under a key you got from a trusted source can be trusted that far.
---
Embark troops from Bray Dunes beach at first light. Destroyer
Codrington will lie off. Keep wireless silent. Report numbers
lifted by lamp.
`);
