/* ==================================================================
   The signals this machine carries, in the order they appear on the
   operator panel. Drop a new file into signals/ and add its name here.
   Nothing else needs editing.

   A file left out of this list still exists on disk and can be pulled
   in mid-game with TELEX.sendFile('06-recall.js') — useful for signals
   the players have to earn.
   ================================================================== */

TELEX.load([
  '01-sailing-orders.js',
  '02-route-x.js',
  '03-the-beaches.js',
  '04-air-attack.js',
  '05-homeward.js'
]);
