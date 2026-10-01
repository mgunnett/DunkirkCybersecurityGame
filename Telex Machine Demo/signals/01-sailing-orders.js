/* A signal file. Headers, a --- rule, then the message.
   Everything between the backticks is plain text: write it normally
   and the machine wraps it, upper-cases it and sets it in the header
   format. The only characters to keep out are a backtick and ${ .

   {HELM}, {COURSE}, {MARK} and {MINUTES} are filled in as the slip
   prints, from where the boat is and which way she's heading, so
   every signal steers her along the next leg of the route. The route
   itself, and what each of the four says, is in ../course.js.

   Headers are all optional. FROM, TO and the sign-off fall back to
   config.js. Any header the machine doesn't know is still handed to
   your puzzle code — see 03-the-beaches.js. */

TELEX.signal(`
SERIAL:   NR 014
PRIORITY: IMMEDIATE
TIME:     2212Z/29 MAY 40
FROM:     V.A. DOVER (DYNAMO)
---
Orders for Operation Dynamo. You are to cross to the
beaches and bring off troops. The direct track is mined.
You will steer the swept channel one leg at a time, and
each leg will reach you by this machine.

{HELM}

Hold {COURSE} for about {MINUTES} to reach {MARK}, then
keep on it until Dover sends the next course. Darken
ship. No wireless.
`);
