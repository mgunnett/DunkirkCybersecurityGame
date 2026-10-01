/* ==================================================================
   DUNKIRK — the game clock
   ------------------------------------------------------------------
   Counts the voyage in real seconds: T = 0 when the Kestrel leaves
   Ramsgate, T = 600 at 15:00. One real second is one in-game minute,
   so the in-game time is simply the start time plus T minutes.

   The clock only runs during the voyage. The intro and the endings
   stop it (pause), and the debug panel can speed it up or jump it.
   ================================================================== */

window.Story = window.Story || {};

Story.Clock = class {
  constructor(start = '05:00', length = 600) {
    const [h, m] = start.split(':').map(Number);
    this.startMinutes = h * 60 + m;   // in-game minutes since midnight at T = 0
    this.length  = length;            // real seconds the voyage lasts
    this.t       = 0;                 // real seconds since departure
    this.speed   = 1;                 // 1 normally; 2 or 5 to test quickly
    this.running = false;
  }

  start()  { this.running = true; }
  pause()  { this.running = false; }

  // Called every frame with the real seconds since the last one.
  // Returns how many voyage seconds passed, so the rest of the game
  // can move by the same amount (that's how the debug speed-up works).
  tick(realDt) {
    if (!this.running) return 0;
    const step = Math.min(realDt * this.speed, this.length - this.t);
    this.t += step;
    return step;
  }

  // Debug: go straight to voyage second t
  jump(t) { this.t = Math.max(0, Math.min(this.length, t)); }

  get finished() { return this.t >= this.length; }

  // The in-game clock face, "HH:MM", for voyage second t (now, by default)
  format(t = this.t) {
    const mins = Math.floor(this.startMinutes + t);
    return String(Math.floor(mins / 60) % 24).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
  }

  // 'T+3:15' -> 195 (real seconds). Writers use this form in dialogue.js.
  static parse(text) {
    const m = String(text).match(/T\+(\d+):(\d{2})/);
    if (!m) throw new Error('[story] bad time "' + text + '": write it as T+M:SS');
    return Number(m[1]) * 60 + Number(m[2]);
  }

  // 195 -> 'T+3:15', for the debug panel
  static label(t) {
    const s = Math.floor(t);
    return 'T+' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
};
