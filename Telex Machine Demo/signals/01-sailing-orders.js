/* A signal file. Headers, a --- rule, then the message.
   Everything between the backticks is plain text: write it normally
   and the machine wraps it, upper-cases it and sets it in the header
   format. The only characters to keep out are a backtick and ${ .

   Headers are all optional. FROM, TO and the sign-off fall back to
   config.js. Any header the machine doesn't know is still handed to
   your puzzle code — see 03-the-beaches.js. */

TELEX.signal(`
SERIAL:   NR 014
PRIORITY: IMMEDIATE
TIME:     2212Z/29 MAY 40
FROM:     V.A. DOVER (DYNAMO)
---
Orders for Operation Dynamo. Proceed from Ramsgate inner
harbour at 2340 in company with tug Sun IV and eight small
craft. On clearing the Gull Stream steer 128 degrees for the
North Goodwin light vessel. Thereafter follow Route Z.

Darken ship completely. No wireless. Acknowledge by lamp.
`);
