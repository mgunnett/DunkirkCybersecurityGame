/* ==================================================================
   DUNKIRK — the dialogue manager (the timing system)
   ------------------------------------------------------------------
   Shows one line at a time in a box on screen. Lines never overlap:
   they wait in a queue and come out in turn.

   How long a line stays up depends on its mode:
     CLICK       until the player clicks it (or presses Space)
     AUTO        for `duration` seconds after it has finished typing
     AUTO_CLICK  the same, or sooner if the player clicks it
   A line with no duration gets 2 s + 0.3 s a word, and never less
   than 3 s.

   The queue:
     - Lines set off by something the player did (event lines, like
       Tom reacting to a refused telex) go to the front, behind any
       other event lines already waiting, so a run of them stays in
       order.
     - Lines set off by the clock (time lines) go to the back.
     - A time line that has waited more than 10 s is dropped as stale,
       unless it is marked critical: true. Event lines never are.
       (TELEX entries never come through here; voyage.js prints them
       on the telex directly, so they can't be dropped.)

   Durations are counted in real seconds, so the debug speed-up makes
   the voyage pass faster but every line is still readable.
   ================================================================== */

window.Story = window.Story || {};

Story.Dialogue = class {
  constructor(data, { act = () => {}, fill = text => text } = {}) {
    this.data  = data;
    this.act   = act;          // runs an onShow / onDone action by name
    this.fill  = fill;         // fills {time} and the like in a line's text
    this.queue = [];           // waiting lines: { entry, at, event }
    this.line  = null;         // the line showing now, if any
    this.CPS   = 50;           // typewriter speed, characters a second
    this.STALE = 10;           // seconds a time line may wait before it's dropped
    this.build();
  }

  // ---- The box ---------------------------------------------------------------
  build() {
    const box = document.createElement('div');
    box.className = 'story-line';
    box.hidden = true;
    box.innerHTML =
      '<p class="story-line__who"></p>' +
      '<p class="story-line__text" aria-hidden="true"></p>' +
      '<p class="story-line__said"></p>' +           // the whole line at once, for screen readers
      '<div class="story-line__choices"></div>' +
      '<p class="story-line__more" aria-hidden="true">Click to continue</p>';
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);

    this.box     = box;
    this.who     = box.querySelector('.story-line__who');
    this.text    = box.querySelector('.story-line__text');
    this.said    = box.querySelector('.story-line__said');
    this.choices = box.querySelector('.story-line__choices');
    this.more    = box.querySelector('.story-line__more');

    box.addEventListener('click', ev => {
      if (ev.target.closest('button')) return;      // a choice handles itself
      this.advance();
    });

    // Space does what a click does, unless the player is on a button
    window.addEventListener('keydown', ev => {
      if (ev.key !== ' ' || !this.line) return;
      if (ev.target.closest && ev.target.closest('button, input, select, textarea, a')) return;
      ev.preventDefault();
      this.advance();
    });
  }

  // On the intro and ending screens the box sits centre stage
  set staged(on) { this.box.classList.toggle('is-staged', on); }

  // ---- Adding lines ----------------------------------------------------------

  // Something happened: queue every line waiting for this event, in script order
  trigger(name) {
    const lines = this.data.lines.filter(l => l.trigger.type === 'event' && l.trigger.value === name);
    let i = this.queue.findIndex(q => !q.event);    // end of the event lines at the front
    if (i < 0) i = this.queue.length;
    for (const entry of lines) this.queue.splice(i++, 0, { entry, at: performance.now(), event: true });
    return lines.length;
  }

  // The clock reached a line's time: it waits at the back
  enqueueTimed(entry) {
    this.queue.push({ entry, at: performance.now(), event: false });
  }

  // Empty the queue and take down the line showing (endings start clean)
  clear() {
    this.queue.length = 0;
    this.hide();
  }

  get busy() { return !!this.line || this.queue.length > 0; }

  // ---- Every frame -------------------------------------------------------------
  update(now = performance.now()) {
    // Drop stale chatter
    this.queue = this.queue.filter(q =>
      q.event || q.entry.critical || (now - q.at) / 1000 <= this.STALE);

    if (this.line) {
      this.type(now);
      // Auto lines count down once the text is all out
      if (this.line.typed && this.line.until && now >= this.line.until) this.done();
      return;
    }
    const next = this.queue.shift();
    if (next) this.show(next.entry, now);
  }

  // ---- Showing a line ------------------------------------------------------------
  show(entry, now) {
    const full = this.fill(entry.text || '');
    this.line = { entry, full, started: now, typed: false, until: 0 };

    this.who.textContent = this.data.speakers[entry.speaker] ?? entry.speaker;
    this.who.hidden = !this.who.textContent;
    this.box.classList.toggle('is-narration', entry.speaker === 'Narrator');
    this.text.textContent = '';
    this.text.hidden = !full;                        // a choice with no line of its own
    this.said.textContent = (this.who.textContent ? this.who.textContent + ': ' : '') + full;
    this.choices.replaceChildren();
    this.more.hidden = true;
    this.box.hidden = false;

    if (entry.scene) this.act('scene', entry.scene);
    if (entry.onShow) this.act(entry.onShow, entry);
    if (!full) this.finishTyping(now);               // a choice with no line of its own
  }

  // Typewriter: reveal the text a few characters a frame
  type(now) {
    const l = this.line;
    if (l.typed) return;
    const shown = Math.floor((now - l.started) / 1000 * this.CPS);
    if (shown >= l.full.length) this.finishTyping(now);
    else this.text.textContent = l.full.slice(0, shown);
  }

  finishTyping(now = performance.now()) {
    const l = this.line;
    l.typed = true;
    this.text.textContent = l.full;
    const { mode, choices } = l.entry;

    if (choices && choices.length) {
      for (const c of choices) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'story-line__choice';
        b.innerHTML = '<span></span>';
        b.firstChild.textContent = c.label;
        b.append(' ' + c.text);
        b.addEventListener('click', () => { l.chosen = c; this.done(); });
        this.choices.appendChild(b);
      }
      this.choices.firstChild.focus({ preventScroll: true });
      return;
    }

    if (mode === 'AUTO' || mode === 'AUTO_CLICK') {
      l.until = now + Story.Dialogue.duration(l.entry, l.full) * 1000;
    }
    this.more.hidden = mode === 'AUTO';
    this.box.classList.toggle('is-clickable', mode !== 'AUTO');
  }

  // A click (or Space): finish the typing first; a second click moves on
  advance() {
    const l = this.line;
    if (!l) return;
    if (!l.typed) { this.finishTyping(); return; }
    if (l.entry.choices && l.entry.choices.length) return;   // pick one
    if (l.entry.mode === 'AUTO') return;                     // can't be hurried
    this.done();
  }

  done() {
    if (!this.line) return;
    const entry = this.line.entry;
    this.hide();
    if (entry.onDone) this.act(entry.onDone, entry);
  }

  hide() {
    this.line = null;
    this.box.hidden = true;
    this.choices.replaceChildren();
    this.box.classList.remove('is-clickable');
  }

  // How long an AUTO line stays up once typed, in seconds
  static duration(entry, text = entry.text || '') {
    if (entry.duration) return entry.duration;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(3, 2 + 0.3 * words);
  }
};
