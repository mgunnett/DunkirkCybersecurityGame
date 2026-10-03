/* ==================================================================
   DUNKIRK — the voyage
   ------------------------------------------------------------------
   Runs everything that happens between leaving Ramsgate and the end:

   TELEXES   Each TELEX entry in dialogue.js prints on the ship's telex
             when its trigger comes round:
               { type: 'time',  value: 'T+0:35' }   at that time
               { type: 'leg',   value: 3 }          once the boat is on
                                                     leg 3 of the route
               { type: 'after', value: 'TX-06:read', delay: 12 }
                                                     that many seconds
                                                     after the event
             Only one slip fits in the machine, so if the last one
             hasn't been read yet, the next waits until it has been
             read and put down (plus a few seconds).

             The words come from one of:
               signal: '02-route-x'  a file in Telex Machine Demo/signals.
                                     Its {HELM}, {COURSE} and the rest
                                     are filled in as it prints, from
                                     where the boat is then (course.js)
               text: `...`           written out in dialogue.js
               replay: true          an earlier true order sent again,
                                     word for word, number and all
               tamper: 'TX-06'       that order again, same number and
                                     time, in clear, with its course
                                     changed
             headers: `...` adds header lines on top of any of these:
             GENUINE / CLUE / LESSON for the cipher desk's debrief, or
             CIPHER / KEYWORD / KEY NAME to send it enciphered. They win
             over the same headers in the file.
             number: true gives a signal the next serial number and a
             time of origin a few minutes before it prints, so it fits
             the series whenever it arrives.

   ROUTE     The marks are in Telex Machine Demo/course.js. The boat's
             leg is the first mark she hasn't reached yet. The latest
             true order's course is the live bearing of its mark from
             where she is, so it stays right as she moves.

   JUDGING   Every telex carries GENUINE / CLUE / LESSON headers, so the
             cipher desk (decoder.js) asks "Is this signal genuine?"
             beside the slip. Answering it judges the telex:
               Suspect                    refused
               Genuine, false order       trusted (wrong)
               Genuine, true order        nothing yet: a true order with
                                          a course still has to be steered
             The player can also judge a telex without the buttons, by
             how they steer, once it has been read:
               true order with a course   followed once the boat holds
                                          its course for trustAfter s,
                                          or reaches the mark it gave
               true order, no course      judged correctly once read
               false order                "trusted" (wrong) if the boat
                                          holds its course for
                                          followAfter s; "refused"
                                          (right) if refuseAfter s pass
                                          after reading without that
             Holding a false course that is also the true one doesn't
             count as following it. A refusal holds only while that
             telex is the latest: follow it later, before the next one
             prints, and it counts as trusted after all, whatever button
             was pressed. An unread telex can't be judged, so it counts
             as wrong.

   CIPHER    Keys and enciphered orders are ordinary TELEX entries with
             Seth's KEY / CIPHER headers. The cipher desk does the
             decoding; the voyage only cares how the player steers.
             course.js spells out the figures in an enciphered order,
             because the cipher only changes letters.

   REPORTS   A German aircraft rightly called can be reported on the
             telex; the sighting's ':reported' line follows.

   SIGHTINGS Buoys and light vessels named by a route mark sit on that
             mark, and count as spotted once held in the binoculars'
             view for half a second; they're missed once the boat is
             sightingGrace s past the mark. Aircraft are sent over at
             their time and the game's own German / Allied question
             decides right or wrong. Only one fits in the sky: an
             aircraft due while another is up waits until it has gone.
             ':overhead' is said as each one actually comes over.

   ENDINGS   victory     the boat reaches the beach, the last mark
             outOfTime   the clock reaches the deadline (18:00)
             lured       a trusted false order's course held luredAfter s
             turnedBack  the same, for the order sending you home

   It reads the ship through window.SHIP and the route through
   window.TELEX_COURSE, and never changes how the wheel, compass,
   telex or binoculars work.
   ================================================================== */

window.Story = window.Story || {};

Story.Voyage = class {
  constructor(data, { clock, dialogue, onEnd }) {
    this.cfg      = data.voyage;
    this.clock    = clock;
    this.dialogue = dialogue;
    this.onEnd    = onEnd;
    const T = Story.Clock.parse;

    // Every line, telex and sighting with a time, in time order; every one
    // waiting for a leg of the route; and every one waiting on an event. Each fires once.
    this.timed = data.lines
      .filter(l => l.trigger.type === 'time')
      .map(entry => ({ entry, at: T(entry.trigger.value), fired: false }))
      .sort((a, b) => a.at - b.at);
    this.byLeg = data.lines
      .filter(l => l.trigger.type === 'leg')
      .map(entry => ({ entry, leg: Number(entry.trigger.value), fired: false }));
    this.after = data.lines
      .filter(l => l.trigger.type === 'after')
      .map(entry => ({ entry, fired: false }));
    this.later = [];           // 'after' entries whose event has happened: { entry, at }

    // One record per telex: what happened to it, for judging and the score
    this.telexes = data.lines.filter(l => l.mode === 'TELEX').map(entry => ({
      entry,
      id: entry.id,
      genuine: entry.correctAction === 'trust',
      steers: entry.newHeading !== undefined || !!entry.signal,   // a true order with a course
      delivered: false, deliveredAt: 0,
      read: false, readAt: 0,
      judged: null,        // 'trust' | 'reject' | null while still open
      correct: false,
      hold: 0,             // seconds held on its course without a break
      reminded: false,
      sig: null,           // the signal as the ship printed it; its events name it
      leg: 0,              // the leg of the route it was printed for
      course: entry.newHeading,   // the course it gave, as printed
      lure: entry.lureHeading,    // where a false one would send her
      copy: ''             // the signal as printed, for a replay
    }));

    // One record per sighting
    this.sightings = data.lines.filter(l => l.mode === 'SPOT').map(entry => ({
      entry,
      id: entry.id,
      until: entry.until ? T(entry.until) : null,
      open: false, done: false,
      placed: false, mark: 0, x: 0, y: 0, looked: 0,
      closest: Infinity,   // nearest the boat has come to it, metres
      passedAt: null,      // when she went past its mark on the route
      correct: false
    }));

    // Serial numbers and times of origin for the signals marked number: true
    const n = this.cfg.numbering;
    const [h, m] = n.lastTime.split(':').map(Number);
    this.serial     = n.lastSerial;
    this.originTime = h * 60 + m;    // in-game minutes since midnight
    this.numbered   = 0;

    this.pending    = [];      // telexes due, waiting their turn on the machine
    this.onSlip     = null;    // the telex on the machine now
    this.unread     = false;
    this.putDownAt  = -Infinity;
    this.order      = null;    // the latest true order with a course
    this.orderSince = 0;
    this.legNow     = 1;       // the leg of the route she's on
    this.nearSaid   = false;
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
      if (rec.genuine && !rec.steers) this.judge(rec, 'trust');
    });

    document.addEventListener('signalputdown', () => { this.putDownAt = performance.now(); });

    // The cipher desk's "Is this signal genuine?" (decoder.js)
    document.addEventListener('telexverdict', ev => {
      const rec = this.telexes.find(r => r.sig && r.sig === ev.detail.signal);
      if (!rec || this.ended) return;
      const verdict = ev.detail.choice ? 'trust' : 'reject';
      if (rec.judged === verdict) return;
      // A true order with a course is trusted by steering it, not by saying so
      if (verdict === 'trust' && rec.genuine && rec.steers) return;
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

  // Tell the dialogue, and start the clock on anything waiting for this event
  say(event) {
    for (const item of this.after) {
      if (item.fired || item.entry.trigger.value !== event) continue;
      item.fired = true;
      this.later.push({ entry: item.entry, at: this.clock.t + (item.entry.trigger.delay || 0) });
    }
    this.dialogue.trigger(event);
  }

  // Where she is, as the position indicator reads it, and which way she's heading
  here() {
    const p = SHIP.position, s = SHIP.start || { x: 0, y: 0 };
    return { x: p.x - s.x, y: p.y - s.y, heading: SHIP.heading };
  }

  // The leg she's on, from course.js. Null if the route didn't load.
  plan() {
    return window.TELEX_COURSE ? TELEX_COURSE.plot(this.here()) : null;
  }

  // The course her latest true order gives from here. Null when she has no
  // orders yet, or has reached its mark and the next order hasn't printed.
  ordered(plan) {
    const o = this.order;
    if (!o) return null;
    if (o.entry.newHeading !== undefined) return o.entry.newHeading;
    return plan && o.leg === plan.leg ? plan.course : null;
  }

  // ---- Every frame of the voyage ----------------------------------------------
  // dt is voyage seconds (faster than real with the debug speed-up)
  update(dt) {
    if (this.ended) return;
    const t = this.clock.t;
    const plan = this.plan();

    // Marks she has reached since the last frame
    if (plan && plan.leg > this.legNow) {
      for (let n = this.legNow; n < plan.leg; n++) this.say('mark:' + n);
      this.legNow = plan.leg;
    }

    // Lines, telexes and sightings whose time, leg or event has come
    for (const item of this.timed) {
      if (item.fired || item.at > t) continue;
      item.fired = true;
      this.fire(item.entry);
    }
    for (const item of this.byLeg) {
      if (item.fired || item.leg > this.legNow) continue;
      item.fired = true;
      this.fire(item.entry);
    }
    this.later = this.later.filter(item => (t >= item.at ? (this.fire(item.entry), false) : true));

    this.feedTelex(plan);
    this.launchNext();

    const heading = SHIP.heading;
    const near = target => Math.abs(Story.Voyage.arc(heading, target)) <= this.cfg.tolerance;

    // On course for the latest true order
    const course = this.ordered(plan);
    const onCourse = course !== null && near(course);
    this.offCourse(onCourse, course !== null, dt, t);

    // Judging by steering
    for (const rec of this.telexes) {
      if (!rec.delivered || !rec.read) continue;
      const e = rec.entry;
      if (rec.genuine && rec.steers && !rec.judged) {
        // She got to the mark it gave: she followed it
        if (e.signal && plan && plan.leg > rec.leg) { this.judge(rec, 'trust'); continue; }
        const its = e.newHeading !== undefined ? e.newHeading : plan && plan.leg === rec.leg ? plan.course : null;
        rec.hold = its !== null && near(its) ? rec.hold + dt : 0;
        if (rec.hold >= this.cfg.trustAfter) this.judge(rec, 'trust');
      } else if (!rec.genuine && !rec.superseded && !(this.lure && this.lure.rec === rec)) {
        // Still followable, even once refused, until a newer telex prints
        rec.hold = this.following(rec, near, onCourse) ? rec.hold + dt : 0;
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
      this.lure.secs = this.following(this.lure.rec, near, onCourse) ? this.lure.secs + dt : 0;
      if (this.lure.secs >= this.cfg.luredAfter) return this.end(this.lure.rec.entry.lure || 'lured');
    }

    // A slip left lying in the machine
    const slip = this.onSlip;
    if (slip && this.unread && !slip.reminded && t - slip.deliveredAt >= this.cfg.unreadWarn) {
      slip.reminded = true;
      this.say('remind:unread');
    }

    this.watchSightings(dt, t, onCourse, plan);

    // Nearly there
    if (plan && !this.nearSaid && plan.leg === plan.legs && plan.metres <= this.cfg.goalNear) {
      this.nearSaid = true;
      this.say('goal:near');
    }

    // The end of the voyage, one way or the other
    if (plan && plan.arrived) return this.end('victory');
    if (this.clock.finished) return this.end('outOfTime');
  }

  fire(entry) {
    if (entry.mode === 'TELEX') this.pending.push(this.telexes.find(r => r.entry === entry));
    else if (entry.mode === 'SPOT') this.openSighting(this.sightings.find(r => r.entry === entry));
    else this.dialogue.enqueueTimed(entry);
  }

  // Holding a false order's course, and not because it's the true course too
  following(rec, near, onCourse) {
    return rec.lure !== undefined && near(rec.lure) && !onCourse;
  }

  // ---- Telexes ------------------------------------------------------------------
  feedTelex(plan) {
    // Not over a slip still in the machine, such as a recon reply nobody has read
    if (!this.pending.length || this.unread || SHIP.reading || SHIP.slipWaiting) return;
    if (performance.now() - this.putDownAt < this.cfg.telexGap * 1000) return;
    this.deliver(this.pending.shift(), plan);
  }

  deliver(rec, plan) {
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

    const text = this.compose(rec, plan);
    if (text === null) return;
    // The ship fills in its course from where she is now (course.js) as it prints
    rec.sig = SHIP.sendSignal(text);             // the signal the ship's events will name
    if (rec.sig && rec.sig.plot) {
      rec.leg = rec.sig.plot.leg;
      rec.course = Number(rec.sig.plot.course);
    }
    rec.copy = rec.sig ? Story.Voyage.asText(rec.sig) : text;

    this.onSlip = rec;
    this.unread = true;

    // A true order with a course sets the course to steer, and outranks any false one followed
    if (rec.genuine && rec.steers) {
      this.order = rec;
      this.orderSince = t;
      this.lure = null;
      this.offFor = 0;
      this.warned = 0;
    }

    this.say(rec.id + ':arrived');
  }

  // The words of a telex, ready for the machine. Null if there's nothing to send.
  compose(rec, plan) {
    const e = rec.entry;
    let text = e.text;
    if (e.signal) {
      // A signal file, as written: the ship fills in its {HELM} and the rest
      const sig = window.TELEX && TELEX.get && TELEX.get(e.signal);
      if (!sig) {
        console.error('[story] ' + rec.id + ': signal file ' + e.signal + ' is not loaded; check signals/manifest.js');
        return null;
      }
      text = Story.Voyage.asText(sig, {}, sig.template !== undefined ? sig.template : sig.body);
    } else if (e.replay) {
      const old = this.replaySource(this.ordered(plan));
      if (!old) { console.warn('[story] ' + rec.id + ': no true order to replay yet'); return null; }
      text = old.copy;
      rec.lure = old.course;
    } else if (e.tamper) {
      const orig = this.telexes.find(r => r.id === e.tamper);
      if (!orig || !orig.copy) { console.warn('[story] ' + rec.id + ': ' + e.tamper + ' has not printed, so there is nothing to tamper with'); return null; }
      rec.lure = orig.course < 260 ? orig.course + 100 : orig.course - 100;   // the first figure changed
      text = this.tampered(orig, rec.lure);
    }
    if (e.headers) text = Story.Voyage.headers(text, e.headers);
    if (e.number) text = Story.Voyage.headers(text, this.nextNumber());
    return text;
  }

  // The next serial number, and a time of origin a few minutes back but after the last
  nextNumber() {
    this.serial += this.numbered++ % 2 ? 2 : 3;
    const now = Math.floor(this.clock.startMinutes + this.clock.t);
    this.originTime = Math.max(this.originTime + 1, now - this.cfg.numbering.ago);
    const hhmm = String(Math.floor(this.originTime / 60) % 24).padStart(2, '0') +
                 String(this.originTime % 60).padStart(2, '0');
    return { serial: 'NR ' + String(this.serial).padStart(3, '0'), time: hhmm + 'Z/' + this.cfg.date };
  }

  // For a replay: the earlier true order whose course is furthest from the one she
  // should be steering now, so following it is plainly wrong
  replaySource(now) {
    const done = this.telexes.filter(r => r.genuine && r.steers && r.copy && r.course !== undefined);
    const older = done.filter(r => r !== this.order);
    const pool = older.length ? older : done;
    if (!pool.length) return null;
    const ref = now !== null ? now : this.order ? this.order.course : 0;
    const off = r => Math.abs(Story.Voyage.arc(ref, r.course));
    return pool.reduce((best, r) => off(r) > off(best) ? r : best);
  }

  // A true order sent again with a different course: same number, same time, same
  // words, in clear, and a helm order worked out for the new course
  tampered(orig, course) {
    const three = String(course).padStart(3, '0');
    const sig = orig.sig;
    if (sig && sig.template !== undefined) {
      return Story.Voyage.asText(sig, { STEER: three, CIPHER: undefined, KEYWORD: undefined, 'KEY NAME': undefined }, sig.template);
    }
    const was = String(orig.course).padStart(3, '0');
    return orig.copy.replace(new RegExp('\\b' + was + '\\b', 'g'), three);
  }

  judge(rec, verdict) {
    rec.judged = verdict;
    rec.correct = verdict === rec.entry.correctAction;
    this.say(rec.id + ':' + verdict);
  }

  // ---- Off course ---------------------------------------------------------------
  offCourse(onCourse, hasCourse, dt, t) {
    if (!hasCourse || onCourse || t - this.orderSince < this.cfg.newCourseGrace) {
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

  // Where a mark goes on the water, in the ship's own metres: on its route mark, or
  // `ahead` of the boat if it has no mark (and then only once she's on course)
  spotFor(s, onCourse) {
    const fixed = s.mark && window.TELEX_COURSE && TELEX_COURSE.marks[s.mark - 1];
    if (fixed) {
      const o = SHIP.start || { x: 0, y: 0 };
      return { x: fixed.x + o.x, y: fixed.y + o.y };
    }
    if (s.mark || !onCourse) return null;
    const pos = SHIP.position;
    const b = (SHIP.heading + (s.offset || 0)) * Math.PI / 180;
    return { x: pos.x + Math.sin(b) * s.ahead, y: pos.y + Math.cos(b) * s.ahead };
  }

  watchSightings(dt, t, onCourse, plan) {
    for (const rec of this.sightings) {
      if (!rec.open || rec.entry.sighting.kind !== 'mark') continue;
      const s = rec.entry.sighting;

      if (!rec.placed) {
        const spot = this.spotFor(s, onCourse);
        if (spot) {
          rec.x = spot.x;
          rec.y = spot.y;
          rec.mark = SHIP.addMark({ art: s.art, x: rec.x, y: rec.y, w: s.w, h: s.h });
          rec.placed = true;
        }
      }
      if (rec.placed) {
        const pos = SHIP.position;
        rec.closest = Math.min(rec.closest, Math.hypot(rec.x - pos.x, rec.y - pos.y));
      }

      if (rec.placed && !rec.done && SHIP.inGlasses(rec.x, rec.y)) {
        rec.looked += dt;
        if (rec.looked >= 0.5) {
          rec.done = true;
          rec.correct = true;
          this.say(rec.id + ':spotted');
        }
      }

      // Its chance is over: a while after she passes its mark, or at its time
      if (s.mark && plan && plan.leg > s.mark && rec.passedAt === null) rec.passedAt = t;
      const over = s.mark ? rec.passedAt !== null && t - rec.passedAt >= this.cfg.sightingGrace
                          : rec.until !== null && t >= rec.until;
      if (!rec.done && over) {
        rec.done = true;
        const near = s.mark ? rec.closest <= this.cfg.sightingRange : rec.placed;
        this.say(rec.id + (near ? ':missed' : ':missedOffCourse'));
      }

      // Taken away long after it's been passed
      const behind = s.mark ? rec.passedAt : rec.until;
      if (rec.done && (!rec.placed || (behind !== null && t >= behind + 150))) {
        if (rec.placed) SHIP.removeMark(rec.mark);
        rec.open = false;
      }
    }
  }

  // ---- The end ------------------------------------------------------------------
  end(kind) {
    if (this.ended) return;
    this.ended = true;
    // Made it: a false order read and never followed was refused
    if (kind === 'victory') {
      for (const r of this.telexes) if (!r.genuine && r.read && !r.judged) this.judge(r, 'reject');
    }
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
  // Only the clock moves: telexes and sightings waiting on a leg still wait for the boat.
  jumpTo(t) {
    for (const item of this.timed) {
      if (item.fired || item.at >= t) continue;
      item.fired = true;
      const { entry } = item;
      if (entry.mode === 'TELEX') {
        const rec = this.telexes.find(r => r.entry === entry);
        rec.delivered = true;
        rec.judged = 'skipped';
        if (rec.genuine && entry.newHeading !== undefined) { this.order = rec; this.orderSince = t; }
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
    const plan = this.plan();
    const course = this.ordered(plan);
    return {
      leg: course === null ? '—' : String(Math.round(course) % 360).padStart(3, '0'),
      heading: String(Math.round(heading) % 360).padStart(3, '0'),
      onCourse: course !== null && Math.abs(Story.Voyage.arc(heading, course)) <= this.cfg.tolerance,
      progress: plan ? 'leg ' + plan.leg + '/' + plan.legs + ', ' + plan.metres + ' m to ' + plan.mark.name
                     : 'no route: Telex Machine Demo/course.js did not load',
      slip: this.onSlip ? this.onSlip.id + (this.unread ? ' (unread)' : '') : '—',
      waiting: this.pending.map(r => r.id).join(' ') || '—',
      lure: this.lure ? this.lure.rec.id + ' ' + Math.round(this.lure.secs) + 's' : '—',
      telexes: this.telexes.map(r => r.id.slice(3) + ':' + (r.judged ? (r.correct ? '✓' : '✗') : r.delivered ? '…' : '·')).join(' '),
      sightings: this.sightings.map(r => r.id + ':' + (r.done ? (r.correct ? '✓' : '✗') : r.placed ? '◎' : r.open ? '…' : '·')).join(' ') +
        this.sightings.filter(r => r.placed && !r.done).map(r => '  ' + r.id + (SHIP.inGlasses(r.x, r.y) ? ' in view' : ' not in view')).join('')
    };
  }

  // A signal written out as a signal file is: headers, ---, then the message.
  // Keys and ciphers go with it, so a replayed order prints just as it did.
  static asText(sig, extra = {}, body = sig.body) {
    const heads = Object.assign({
      SERIAL: sig.serial, PRIORITY: sig.priority, TIME: sig.time,
      FROM: sig.from, TO: sig.to, SIGN: sig.sign, STEER: sig.steer,
      KEY: sig.key, CIPHER: sig.cipher, KEYWORD: sig.keyword, 'KEY NAME': sig.key_name
    }, extra);
    return Object.keys(heads).filter(k => heads[k] !== undefined)
      .map(k => k + ': ' + heads[k]).join('\n') + '\n---\n' + (body || '');
  }

  // Put headers into a signal's text, just above its --- rule, where they win.
  // `heads` is { name: value }, or header lines written out as in a signal file.
  static headers(text, heads) {
    const add = typeof heads === 'string'
      ? heads.split('\n').map(l => l.trim()).filter(Boolean).join('\n')
      : Object.keys(heads).map(k => k.toUpperCase() + ': ' + heads[k]).join('\n');
    return /^[ \t]*-{3,}[ \t]*$/m.test(text)
      ? text.replace(/^([ \t]*-{3,}[ \t]*)$/m, (all, rule) => add + '\n' + rule)
      : add + '\n---\n' + text;
  }

  // Shortest signed angle from a to b, in degrees
  static arc(a, b) {
    let d = ((b - a) % 360 + 540) % 360 - 180;
    return d;
  }
};
