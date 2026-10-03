/* ==================================================================
   DUNKIRK — the voyage
   ------------------------------------------------------------------
   Runs everything that happens between leaving Ramsgate and the end:

   TELEXES   Each TELEX line in dialogue.js prints on the ship's telex
             at its time. Only one slip fits in the machine, so if the
             last one hasn't been read yet, the next waits until it has
             been read and put down (plus a few seconds).

   JUDGING   Every telex carries GENUINE / CLUE / LESSON headers, so the
             cipher desk (decoder.js) asks "Is this signal genuine?"
             beside the slip. Answering it judges the telex:
               Suspect                    refused
               Genuine, false order       trusted (wrong)
               Genuine, true order        nothing yet: a true order with
                                          a course still has to be steered
             The player can also judge a telex without the buttons, by
             how they steer:
               true order with a course   followed once the boat holds
                                          that course for trustAfter s
               true order, no course      judged correctly once read
               false order                "trusted" (wrong) if, after
                                          reading it, the boat holds its
                                          course for followAfter s;
                                          "refused" (right) if refuseAfter
                                          s pass after reading without that
             A refusal holds only while that telex is the latest: follow
             it later, before the next one prints, and it counts as
             trusted after all, whatever button was pressed. An unread
             telex can't be judged, so it counts as wrong.

   CIPHER    Keys and enciphered orders are ordinary TELEX lines with
             Seth's KEY / CIPHER headers. The cipher desk does the
             decoding; the voyage only cares how the player steers.

   REPORTS   A German aircraft rightly called can be reported on the
             telex; the sighting's ':reported' line follows.

   COURSE    The latest true order with a course sets the leg. Each
             second on that course (within `tolerance` degrees) adds a
             second of route progress. Off course too long sets off
             Tom's reminders.

   SIGHTINGS Buoys appear on the water ahead during their window, but
             only once the boat is on course. They count as spotted
             once held in the binoculars' view for half a second.
             Aircraft are sent over at their time and the game's
             own German / Allied question decides right or wrong.
             Only one fits in the sky: an aircraft due while another
             is up waits until it has gone. ':overhead' is said as
             each one actually comes over.

   ENDINGS   victory     on the last leg with routeSeconds of progress
             outOfTime   the clock reaches the deadline (18:00)
             lured       a trusted false order's course held luredAfter s
             turnedBack  the same, for the order sending you home

   It reads the ship through window.SHIP (see the ship page) and never
   changes how the wheel, compass, telex or binoculars work.
   ================================================================== */

window.Story = window.Story || {};

Story.Voyage = class {
  constructor(data, { clock, dialogue, onEnd }) {
    this.cfg      = data.voyage;
    this.clock    = clock;
    this.dialogue = dialogue;
    this.onEnd    = onEnd;
    const T = Story.Clock.parse;

    // Every line with a time, in time order. Each fires once.
    this.timed = data.lines
      .filter(l => l.trigger.type === 'time')
      .map(entry => ({ entry, at: T(entry.trigger.value), fired: false }))
      .sort((a, b) => a.at - b.at);

    // One record per telex: what happened to it, for judging and the score
    this.telexes = data.lines.filter(l => l.mode === 'TELEX').map(entry => ({
      entry,
      id: entry.id,
      genuine: entry.correctAction === 'trust',
      delivered: false, deliveredAt: 0,
      read: false, readAt: 0,
      judged: null,        // 'trust' | 'reject' | null while still open
      correct: false,
      hold: 0,             // seconds held on its course without a break
      reminded: false
    }));

    // One record per sighting
    this.sightings = data.lines.filter(l => l.mode === 'SPOT').map(entry => ({
      entry,
      id: entry.id,
      until: entry.until ? T(entry.until) : null,
      open: false, done: false,
      placed: false, mark: 0, x: 0, y: 0, looked: 0,
      correct: false
    }));

    this.pending    = [];      // telexes due, waiting their turn on the machine
    this.onSlip     = null;    // the telex on the machine now
    this.unread     = false;
    this.putDownAt  = -Infinity;
    this.leg        = null;    // { heading, rec, since }
    this.progress   = 0;       // seconds on course
    this.offFor     = 0;       // seconds off course without a break
    this.warned     = 0;       // 0, 1 (gentle) or 2 (urgent) this spell off course
    this.lure       = null;    // { rec, secs } once a false order has been followed
    this.plane      = null;    // the aircraft sighting in the sky now
    this.reportable = null;    // a German aircraft identified and not yet reported
    this.skies      = [];      // aircraft sightings due, waiting for the sky to clear
    this.ended      = false;

    this.listen();
  }

  // ---- What the ship tells us -------------------------------------------------
  listen() {
    document.addEventListener('signalread', ev => {
      const rec = this.onSlip;
      if (!rec || rec.read || ev.detail.signal !== rec.sig) return;   // not a recon reply
      rec.read = true;
      rec.readAt = this.clock.t;
      this.unread = false;
      this.say(rec.id + ':read');
      if (rec.genuine && rec.entry.newHeading === undefined) this.judge(rec, 'trust');
    });

    document.addEventListener('signalputdown', () => { this.putDownAt = performance.now(); });

    // The cipher desk's "Is this signal genuine?" (decoder.js)
    document.addEventListener('telexverdict', ev => {
      const rec = this.telexes.find(r => r.sig && r.sig === ev.detail.signal);
      if (!rec || this.ended) return;
      const verdict = ev.detail.choice ? 'trust' : 'reject';
      if (rec.judged === verdict) return;
      // A true order with a course is trusted by steering it, not by saying so
      if (verdict === 'trust' && rec.genuine && rec.entry.newHeading !== undefined) return;
      this.judge(rec, verdict);
    });

    document.addEventListener('aircraftidentified', ev => {
      const rec = this.plane;
      if (!rec || rec.done) return;
      rec.done = true;
      rec.correct = ev.detail.correct;
      if (rec.correct) this.reportable = rec;    // a German one can now be reported
      this.say(rec.id + (rec.correct ? ':correct' : ':wrong'));
    });

    document.addEventListener('aircraftreported', () => {
      const rec = this.reportable;
      this.reportable = null;
      if (rec && !this.ended) this.say(rec.id + ':reported');
    });

    document.addEventListener('aircraftgone', () => {
      const rec = this.plane;
      this.plane = null;
      if (!rec || rec.done) return;
      rec.done = true;
      this.say(rec.id + ':missed');
    });
  }

  say(event) { this.dialogue.trigger(event); }

  // ---- Every frame of the voyage ----------------------------------------------
  // dt is voyage seconds (faster than real with the debug speed-up)
  update(dt) {
    if (this.ended) return;
    const t = this.clock.t;

    // Lines, telexes and sightings whose time has come
    for (const item of this.timed) {
      if (item.fired || item.at > t) continue;
      item.fired = true;
      const { entry } = item;
      if (entry.mode === 'TELEX') this.pending.push(this.telexes.find(r => r.entry === entry));
      else if (entry.mode === 'SPOT') this.openSighting(this.sightings.find(r => r.entry === entry));
      else this.dialogue.enqueueTimed(entry);
    }

    this.feedTelex();
    this.launchNext();

    const heading = SHIP.heading;
    const near = target => Math.abs(Story.Voyage.arc(heading, target)) <= this.cfg.tolerance;

    // Course and route progress
    const onCourse = !!this.leg && near(this.leg.heading);
    if (onCourse) this.progress += dt;
    this.offCourse(onCourse, dt, t);

    // Judging by steering
    for (const rec of this.telexes) {
      if (!rec.delivered) continue;
      const e = rec.entry;
      if (rec.genuine && e.newHeading !== undefined && !rec.judged) {
        rec.hold = near(e.newHeading) ? rec.hold + dt : 0;
        if (rec.hold >= this.cfg.trustAfter) this.judge(rec, 'trust');
      } else if (!rec.genuine && rec.read && !rec.superseded && !(this.lure && this.lure.rec === rec)) {
        // Still followable, even once refused, until a newer telex prints
        rec.hold = e.lureHeading !== undefined && near(e.lureHeading) ? rec.hold + dt : 0;
        if (rec.hold >= this.cfg.followAfter) {
          if (rec.judged !== 'trust') this.judge(rec, 'trust');
          this.lure = { rec, secs: rec.hold };
        } else if (!rec.judged && t - rec.readAt >= this.cfg.refuseAfter) {
          this.judge(rec, 'reject');
        }
      }
    }

    // Someone who followed a false order and keeps to it
    if (this.lure) {
      this.lure.secs = near(this.lure.rec.entry.lureHeading) ? this.lure.secs + dt : 0;
      if (this.lure.secs >= this.cfg.luredAfter) return this.end(this.lure.rec.entry.lure || 'lured');
    }

    // A slip left lying in the machine
    const slip = this.onSlip;
    if (slip && this.unread && !slip.reminded && t - slip.deliveredAt >= this.cfg.unreadWarn) {
      slip.reminded = true;
      this.say('remind:unread');
    }

    this.watchSightings(dt, t, onCourse);

    // The end of the voyage, one way or the other
    const lastLeg = this.leg && !this.telexes.some(r => r.genuine && r.entry.newHeading !== undefined && !r.delivered);
    if (lastLeg && this.progress >= this.cfg.routeSeconds) return this.end('victory');
    if (this.clock.finished) return this.end('outOfTime');
  }

  // ---- Telexes ------------------------------------------------------------------
  feedTelex() {
    // Not over a slip still in the machine, such as a recon reply nobody has read
    if (!this.pending.length || this.unread || SHIP.reading || SHIP.slipWaiting) return;
    if (performance.now() - this.putDownAt < this.cfg.telexGap * 1000) return;
    this.deliver(this.pending.shift());
  }

  deliver(rec) {
    const t = this.clock.t;

    // False orders before this one are now out of date: read but not followed is
    // refused for good
    for (const r of this.telexes) {
      if (!r.delivered || r.genuine) continue;
      if (!r.judged && r.read) this.judge(r, 'reject');
      r.superseded = true;
    }

    rec.delivered = true;
    rec.deliveredAt = t;
    this.onSlip = rec;
    this.unread = true;

    // A true order with a course starts the next leg, and outranks any false one followed
    if (rec.genuine && rec.entry.newHeading !== undefined) {
      this.leg = { heading: rec.entry.newHeading, rec, since: t };
      this.lure = null;
      this.offFor = 0;
      this.warned = 0;
    }

    rec.sig = SHIP.sendSignal(rec.entry.text);   // the signal the ship's events will name
    this.say(rec.id + ':arrived');
  }

  judge(rec, verdict) {
    rec.judged = verdict;
    rec.correct = verdict === rec.entry.correctAction;
    this.say(rec.id + ':' + verdict);
  }

  // ---- Off course ---------------------------------------------------------------
  offCourse(onCourse, dt, t) {
    if (!this.leg || onCourse || t - this.leg.since < this.cfg.newCourseGrace) {
      this.offFor = 0;
      this.warned = 0;
      return;
    }
    this.offFor += dt;
    if (this.warned < 1 && this.offFor >= this.cfg.offCourseWarn) {
      this.warned = 1;
      this.say('remind:offCourse');
    }
    if (this.warned < 2 && this.offFor >= this.cfg.offCourseUrgent) {
      this.warned = 2;
      this.say('remind:offCourseUrgent');
    }
  }

  // ---- Sightings ----------------------------------------------------------------
  openSighting(rec) {
    rec.open = true;
    if (rec.entry.sighting.kind === 'aircraft') {
      rec.open = false;
      this.skies.push(rec);                      // one aircraft up at a time: it waits its turn
      this.launchNext();
    }
  }

  // Send the next aircraft waiting for an empty sky, and say it's overhead
  launchNext() {
    if (this.plane || !this.skies.length) return;
    const rec = this.skies[0];
    if (!SHIP.sendAircraft(rec.entry.sighting.aircraft)) return;   // the sky isn't clear yet
    this.skies.shift();
    this.plane = rec;
    this.say(rec.id + ':overhead');
  }

  watchSightings(dt, t, onCourse) {
    for (const rec of this.sightings) {
      if (!rec.open || rec.entry.sighting.kind !== 'mark') continue;
      const s = rec.entry.sighting;

      // It's only out there if you're where you should be
      if (!rec.placed && onCourse) {
        const pos = SHIP.position;
        const b = (SHIP.heading + (s.offset || 0)) * Math.PI / 180;
        rec.x = pos.x + Math.sin(b) * s.ahead;
        rec.y = pos.y + Math.cos(b) * s.ahead;
        rec.mark = SHIP.addMark({ art: s.art, x: rec.x, y: rec.y, w: s.w, h: s.h });
        rec.placed = true;
        rec.removeAt = rec.until + 150;            // long after it's been passed
      }

      if (rec.placed && !rec.done && SHIP.inGlasses(rec.x, rec.y)) {
        rec.looked += dt;
        if (rec.looked >= 0.5) {
          rec.done = true;
          rec.correct = true;
          this.say(rec.id + ':spotted');
        }
      }

      if (!rec.done && t >= rec.until) {
        rec.done = true;
        this.say(rec.id + (rec.placed ? ':missed' : ':missedOffCourse'));
      }

      if (rec.done && (!rec.placed || t >= rec.removeAt)) {
        if (rec.placed) SHIP.removeMark(rec.mark);
        rec.open = false;
      }
    }
  }

  // ---- The end ------------------------------------------------------------------
  end(kind) {
    if (this.ended) return;
    this.ended = true;
    this.onEnd(kind, this.score());
  }

  score() {
    return {
      telexes:   this.telexes.filter(r => r.correct).length,
      sightings: this.sightings.filter(r => r.correct).length,
      telexTotal:    this.telexes.length,
      sightingTotal: this.sightings.length,
      time:      this.clock.format()
    };
  }

  // ---- Debug: jump to voyage second t, as if everything before had happened -------
  jumpTo(t) {
    for (const item of this.timed) {
      if (item.fired || item.at >= t) continue;
      item.fired = true;
      const { entry } = item;
      if (entry.mode === 'TELEX') {
        const rec = this.telexes.find(r => r.entry === entry);
        rec.delivered = true;
        rec.judged = 'skipped';
        if (rec.genuine && entry.newHeading !== undefined) this.leg = { heading: entry.newHeading, rec, since: t };
      }
      if (entry.mode === 'SPOT') this.sightings.find(r => r.entry === entry).done = true;
    }
    this.pending = this.pending.filter(r => !r.delivered);
    this.lure = null;
    this.clock.jump(t);
  }

  // For the debug panel
  status() {
    const heading = SHIP.heading;
    return {
      leg: this.leg ? String(this.leg.heading).padStart(3, '0') : '—',
      heading: String(Math.round(heading) % 360).padStart(3, '0'),
      onCourse: !!this.leg && Math.abs(Story.Voyage.arc(heading, this.leg.heading)) <= this.cfg.tolerance,
      progress: Math.round(this.progress) + ' / ' + this.cfg.routeSeconds,
      slip: this.onSlip ? this.onSlip.id + (this.unread ? ' (unread)' : '') : '—',
      waiting: this.pending.map(r => r.id).join(' ') || '—',
      lure: this.lure ? this.lure.rec.id + ' ' + Math.round(this.lure.secs) + 's' : '—',
      telexes: this.telexes.map(r => r.id.slice(3) + ':' + (r.judged ? (r.correct ? '✓' : '✗') : r.delivered ? '…' : '·')).join(' '),
      sightings: this.sightings.map(r => r.id + ':' + (r.done ? (r.correct ? '✓' : '✗') : r.placed ? '◎' : r.open ? '…' : '·')).join(' ') +
        this.sightings.filter(r => r.placed && !r.done).map(r => '  ' + r.id + (SHIP.inGlasses(r.x, r.y) ? ' in view' : ' not in view')).join('')
    };
  }

  // Shortest signed angle from a to b, in degrees
  static arc(a, b) {
    let d = ((b - a) % 360 + 540) % 360 - 180;
    return d;
  }
};
