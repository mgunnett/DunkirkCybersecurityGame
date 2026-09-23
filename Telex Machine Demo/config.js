/* ==================================================================
   TELEX — settings
   ------------------------------------------------------------------
   Safe to change without touching telex.js.
   Print speed is fixed at 40 characters a second, in telex.js.
   ================================================================== */

window.TELEX_CONFIG = {

  /* Who the machine belongs to. Used as the default TO: on every
     signal and printed in the header line. */
  ship:     'M.Y. KESTREL',
  callsign: 'GBKW',

  /* Default FROM:, for signals that don't name a sender. */
  station:  'V.A. DOVER (DYNAMO)',

  /* Default sign-off, printed above the end-of-message mark. */
  sign:     'ACKNOWLEDGE BY LAMP ON SIGHT.',

  /* Width the message body is wrapped to, in characters. This sets
     how wide the slip of paper is, so keep it narrow for a compact
     machine — 38 suits a 320px prop. */
  columns: 38,

  /* How many slips stay in the bay before the oldest scroll away for
     good. Keeps a long game from growing an endless roll. */
  keepSlips: 12,

  /* Don't hand out the same signal twice in a row when the Receive
     button picks at random. */
  noRepeat: true,

  /* Delay in ms between a signal arriving and the lamp lighting.
     Raise it if you want the machine to feel like it's waking up. */
  alertDelay: 0,

  /* Hide the operator panel outright. Set true for the live install
     if you'd rather not delete the markup. */
  hideOperatorPanel: false
};
