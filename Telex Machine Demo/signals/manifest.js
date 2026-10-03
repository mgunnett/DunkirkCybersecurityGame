/* ==================================================================
   The signals this machine carries, in the order they appear on the
   operator panel. Drop a new file into signals/ and add its name here.
   Nothing else needs editing.

   A file left out of this list still exists on disk and can be pulled
   in mid-game with TELEX.sendFile('13-something.js') — useful for
   signals the players have to earn.

   The full game (../Script) sends 01 to 06 itself, one per leg of the
   route, so keep all six listed here.

   07 to 11 are the security drill: a day key and the order it unlocks,
   a phishing signal in clear, and a forged key with a forged order
   enciphered under it. They open the cipher desk (desk.js).
   ================================================================== */

TELEX.load([
  '01-sailing-orders.js',
  '02-route-x.js',
  '03-the-beaches.js',
  '04-air-attack.js',
  '05-homeward.js',
  '06-recall.js',          // the last leg; the full game sends it at the Zuydcoote Pass
  '07-day-key.js',
  '08-bray-dunes.js',
  '09-fuel-request.js',
  '10-replacement-key.js',
  '11-la-panne.js'
]);
