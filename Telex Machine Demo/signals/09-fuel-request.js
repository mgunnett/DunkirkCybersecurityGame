/* A phishing signal sent in clear. No cipher headers, so it prints
   as written. Everything the player needs to catch it is on the slip. */

TELEX.signal(`
SERIAL:   NR 073
PRIORITY: MOST IMMEDIATE
TIME:     0430Z/31 MAY 40
FROM:     V.A. D0VER (DYNAM0)
SIGN:     REPLY AT ONCE OR LOSE YOUR BERTH.
GENUINE:  no
CLUE 1:   FM V.A. D0VER (DYNAM0) | The sender is spelled with zeros in place of the letter O. A lookalike name is the oldest trick there is, so read the sender character by character.
CLUE 2:   Today's cipher key | Dover issued the key and never needs it back. No genuine sender asks you for a key or a password.
CLUE 3:   Reply by wireless | Standing orders are no wireless. A message that asks you to break your own security rules is the warning in itself.
CLUE 4:   Within ten minutes | Invented urgency stops you checking. Real orders leave time to verify.
CLUE 5:   Sent in clear | An order this important would come enciphered under the day key. This one could have been typed by anybody.
LESSON:   This is phishing: a lookalike sender, a deadline, a threat, and a request for a secret. Check by a separate route you already trust, such as a lamp signal to the escort, before you act, and never send a key or password because a message asks for it.
---
Fuel allocation for small craft is being revised. To keep your
berth on the next convoy, reply by wireless within ten minutes
with your position, fuel state and today's cipher key so that we
can confirm your identity.

Craft that do not answer will be struck from the list.
`);
