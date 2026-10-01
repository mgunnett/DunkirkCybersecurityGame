/* ==================================================================
   The signals this machine carries, in the order they appear on the
   operator panel. Drop a new file into signals/ and add its name here.
   Nothing else needs editing.

   A file left out of this list still exists on disk and can be pulled
   in mid-game with TELEX.sendFile('06-recall.js') — useful for signals
   the players have to earn.

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
  '07-day-key.js',
  '08-bray-dunes.js',
  '09-fuel-request.js',
  '10-replacement-key.js',
  '11-la-panne.js'
  '07-weather.js',
  '08-kwinte-key.js',      // key first: the cipher waits for it
  '09-kwinte-cipher.js',
  '10-fuel-and-water.js',
  '11-malo-key.js',
  '12-malo-cipher.js'
]);
