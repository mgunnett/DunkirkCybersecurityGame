/* Deliberately not listed in manifest.js. It doesn't exist as far as
   the machine is concerned until your puzzle code calls

       TELEX.sendFile('06-recall.js')

   at which point it loads, joins the operator panel and the lamp
   lights. Use this for signals the players have to earn. */

TELEX.signal(`
SERIAL:   NR 097
PRIORITY: MOST IMMEDIATE
TIME:     0902Z/31 MAY 40
---
Dynamo closing. Last lift from the eastern mole at 0300
tomorrow. All small craft still on the beaches to withdraw
after this tide whatever their state of loading.

Do not wait for stragglers. Do not return.
`);
