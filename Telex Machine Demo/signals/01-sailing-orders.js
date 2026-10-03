/* A signal file. Headers, a --- rule, then the message.
   Everything between the backticks is plain text: write it normally
   and the machine wraps it, upper-cases it and sets it in the header
   format. The only characters to keep out are a backtick and ${ .

   {HELM}, {COURSE}, {MARK}, {WHY} and the rest are filled in as the
   slip prints, from where the boat is and which way she's heading,
   so every signal steers her along the next leg of the route. The
   route itself, and what each one prints as, is in ../course.js.

   In the full game (../Script) signals 01 to 06 are the true orders,
   sent one leg at a time as the boat reaches each mark. The Script
   numbers and times them as they go out, so SERIAL and TIME here
   only show on the teleprinter when it runs on its own.

   Headers are all optional. FROM, TO and the sign-off fall back to
   config.js. Any header the machine doesn't know is still handed to
   your puzzle code — see 03-the-beaches.js. */

TELEX.signal(`
SERIAL:   NR 014
PRIORITY: IMMEDIATE
TIME:     2212Z/29 MAY 40
FROM:     V.A. DOVER (DYNAMO)
---
Orders for Operation Dynamo. Cross to the beaches and bring
off troops. The direct track is mined, so do not steer
straight for the beach. Dover will send you through the swept
channel one leg at a time, by this machine.

Next mark: {MARK}. {WHY}

{HELM}

When you turn, she keeps turning until the wheel is back in
the middle, so start easing it back just before the compass
reaches the new course.
`);
