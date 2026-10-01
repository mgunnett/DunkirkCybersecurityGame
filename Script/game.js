/* ==================================================================
   DUNKIRK — the game
   ------------------------------------------------------------------
   The flow, one state at a time:

     TITLE ──Begin──▶ INTRO ──last line──▶ VOYAGE ──an ending──▶ ENDING
       ▲                (clock stopped)     (clock running)   (clock stopped)
       └──────────────────────── Play again ◀───────────────────────┘

   Play again reloads the page, so the clock, the dialogue queue, the
   telex, the rulebook, the score and the boat all start fresh.

   While the title, intro or an ending is up, the boat is held still
   (SHIP.hold) and nothing arrives. In the voyage, one loop runs it
   all: the clock ticks, the voyage moves on by the same amount, and
   the dialogue box shows whatever is next.

   Debug panel: add ?debug to the page address, or press ` (backquote).
   It speeds the clock up (×2, ×5), jumps to a time, and shows what
   the voyage is doing.
   ================================================================== */

(() => {
  'use strict';

  const DATA = window.STORY_DATA;
  if (!DATA || !window.SHIP) {
    console.error('[story] dialogue.js or the ship page is missing; the story will not run.');
    return;
  }

  const ENDING_TITLES = {
    victory:    'You reached the beaches',
    outOfTime:  'Too late',
    lured:      'Lured off course',
    turnedBack: 'Turned back'
  };

  let state = 'title';
  let final = { time: '', telexes: 0, sightings: 0, telexTotal: 0, sightingTotal: 0 };   // filled in at the end

  const clock = new Story.Clock(DATA.voyage.start, DATA.voyage.length);

  const dialogue = new Story.Dialogue(DATA, {
    act: (name, arg) => actions[name] && actions[name](arg),
    fill: text => text
      .replace(/\{time\}/g, final.time)
      .replace(/\{telexes\}/g, final.telexes)
      .replace(/\{sightings\}/g, final.sightings)
      .replace(/\{telexTotal\}/g, final.telexTotal)
      .replace(/\{sightingTotal\}/g, final.sightingTotal)
  });

  // Artwork for the two marks the script puts on the water, in the same form as the
  // ship's own <template id="art-..."> marks. Drawn at their real proportions.
  document.body.insertAdjacentHTML('beforeend', `
<template id="art-lightvessel">
  <svg class="art art--lightvessel" viewBox="0 0 200 82" preserveAspectRatio="none">
    <rect class="lv__mast" x="96" y="2" width="5" height="52"/>
    <circle class="lv__lantern" cx="98.5" cy="10" r="9"/>
    <rect class="lv__house" x="70" y="40" width="34" height="14"/>
    <path class="lv__hull" d="M4 52 L196 52 L182 76 L18 76 Z"/>
    <text class="lv__name" x="100" y="70">N. GOODWIN</text>
    <path class="art__wash" d="M0 76 Q100 68 200 76 Q100 82 0 76 Z"/>
  </svg>
</template>
<template id="art-kwinte">
  <svg class="art art--kwinte" viewBox="0 0 50 100" preserveAspectRatio="none">
    <path class="kw__top" d="M25 2 L38 22 L12 22 Z"/>
    <rect class="kw__cage" x="23" y="22" width="4" height="16"/>
    <path class="kw__body" d="M10 38 L40 38 L44 90 L6 90 Z"/>
    <rect class="kw__band" x="8" y="56" width="34" height="14"/>
    <text class="kw__name" x="25" y="67">KWINTE</text>
    <path class="art__wash" d="M0 90 Q25 82 50 90 Q25 98 0 90 Z"/>
  </svg>
</template>`);

  const voyage = new Story.Voyage(DATA, { clock, dialogue, onEnd: (kind, score) => toEnding(kind, score) });

  // The Script sends the telexes and aircraft from here on; the boat waits for Begin
  SHIP.script({ signals: true, aircraft: true });
  SHIP.hold(true);

  // ---- Screens ------------------------------------------------------------------
  const el = tag => document.createElement(tag);

  // A full-screen stage over the helm, for the title, intro and endings
  const stage = el('div');
  stage.className = 'story-stage';
  stage.innerHTML =
    '<div class="story-stage__card">' +
      '<p class="story-stage__kicker"></p>' +
      '<h1 class="story-stage__title"></h1>' +
      '<p class="story-stage__sub"></p>' +
      '<div class="story-stage__actions"></div>' +
    '</div>';
  document.body.appendChild(stage);
  const card = {
    kicker:  stage.querySelector('.story-stage__kicker'),
    title:   stage.querySelector('.story-stage__title'),
    sub:     stage.querySelector('.story-stage__sub'),
    actions: stage.querySelector('.story-stage__actions')
  };

  // Clicking the stage itself moves the dialogue on, as clicking the box does
  stage.addEventListener('click', ev => {
    if (ev.target.closest('button')) return;
    if (state === 'intro' || state === 'ending') dialogue.advance();
  });

  function setCard({ kicker = '', title = '', sub = '', buttons = [] }) {
    card.kicker.textContent = kicker;
    card.title.textContent = title;
    card.sub.textContent = sub;
    card.actions.replaceChildren(...buttons.map(([label, fn, quiet]) => {
      const b = el('button');
      b.type = 'button';
      b.className = 'story-button' + (quiet ? ' story-button--quiet' : '');
      b.textContent = label;
      b.addEventListener('click', fn);
      return b;
    }));
    stage.classList.toggle('has-card', !!(kicker || title || sub || buttons.length));
  }

  // The in-game clock, on a brass plate at the top left
  const plate = el('p');
  plate.className = 'story-clock';
  plate.hidden = true;
  plate.setAttribute('aria-label', 'Time');
  document.body.appendChild(plate);

  // ---- What the script's onShow / onDone can ask for --------------------------------
  const actions = {
    scene:         text => setCard({ kicker: text }),
    openRulebook:  () => SHIP.openRulebook(),
    closeRulebook: () => SHIP.closeRulebook(),
    startVoyage:   () => toVoyage()
  };

  // ---- The states ----------------------------------------------------------------
  function toTitle() {
    state = 'title';
    stage.hidden = false;
    stage.classList.add('is-title');
    const buttons = [['Begin', toIntro]];
    if (debug.on) buttons.push(['Skip the intro', toVoyage, true]);
    setCard({
      kicker: 'Operation Dynamo · May 1940',
      title: 'Dunkirk Telex',
      sub: 'Sail the Kestrel from Ramsgate to the beaches of Dunkirk. Your orders come by telex. Some of them are false.',
      buttons
    });
    card.actions.firstChild.focus({ preventScroll: true });
  }

  function toIntro() {
    state = 'intro';
    stage.classList.remove('is-title');
    setCard({});
    dialogue.staged = true;
    dialogue.trigger('intro');
  }

  function toVoyage() {
    if (state === 'voyage') return;
    state = 'voyage';
    dialogue.clear();
    dialogue.staged = false;
    SHIP.closeRulebook();
    stage.hidden = true;
    stage.classList.remove('is-title');
    plate.hidden = false;
    SHIP.hold(false);
    clock.start();
  }

  function toEnding(kind, score) {
    state = 'ending';
    final = score;
    clock.pause();
    SHIP.hold(true);

    // Put down whatever's in hand, so the ending has the screen
    SHIP.closeRulebook();
    if (SHIP.reading) document.getElementById('signalBack').click();
    if (SHIP.glassesUp) document.getElementById('glassLower').click();

    dialogue.clear();
    dialogue.staged = true;
    stage.hidden = false;
    setCard({ kicker: score.time, title: ENDING_TITLES[kind] || '' });
    dialogue.trigger('ending:' + kind);
    endingKind = kind;
  }

  // After the last ending line: the score, and a way back to the title
  let endingKind = null;
  let scoreShown = false;
  function showScore() {
    scoreShown = true;
    setCard({
      kicker: final.time,
      title: ENDING_TITLES[endingKind] || '',
      sub: final.telexes + ' of ' + final.telexTotal + ' telexes judged correctly · ' +
           final.sightings + ' of ' + final.sightingTotal + ' sightings correct',
      buttons: [['Play again', () => location.reload()]]
    });
    card.actions.firstChild.focus({ preventScroll: true });
  }

  // ---- The loop ------------------------------------------------------------------
  let last = performance.now();
  function frame(now) {
    const realDt = Math.min((now - last) / 1000, 0.1);
    last = now;

    if (state === 'voyage') {
      const step = clock.tick(realDt);
      voyage.update(step);
      plate.textContent = clock.format();
    }
    dialogue.update(now);
    if (state === 'ending' && !scoreShown && !dialogue.busy) showScore();
    if (debug.on) debug.show();
    requestAnimationFrame(frame);
  }

  // ---- Debug panel ---------------------------------------------------------------
  const debug = {
    on: /[?&]debug\b/.test(location.search),
    panel: null,

    build() {
      const p = el('div');
      p.className = 'story-debug';
      p.innerHTML =
        '<p class="story-debug__head">Debug</p>' +
        '<div class="story-debug__row" data-speed>' +
          '<button type="button" data-x="1">×1</button>' +
          '<button type="button" data-x="2">×2</button>' +
          '<button type="button" data-x="5">×5</button>' +
        '</div>' +
        '<form class="story-debug__row" data-jump>' +
          '<input type="text" value="T+3:00" aria-label="Jump to time" size="7">' +
          '<button type="submit">Jump</button>' +
        '</form>' +
        '<pre class="story-debug__state"></pre>';
      document.body.appendChild(p);
      p.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', () => { clock.speed = Number(b.dataset.x); }));
      p.querySelector('[data-jump]').addEventListener('submit', ev => {
        ev.preventDefault();
        try {
          const t = Story.Clock.parse(p.querySelector('input').value);
          if (state !== 'voyage') toVoyage();
          voyage.jumpTo(t);
        } catch (e) { alert(e.message); }
      });
      this.panel = p;
      this.state = p.querySelector('.story-debug__state');
    },

    show() {
      if (!this.panel) this.build();
      this.panel.hidden = false;
      const s = voyage.status();
      this.panel.querySelectorAll('[data-x]').forEach(b => b.classList.toggle('is-on', Number(b.dataset.x) === clock.speed));
      this.state.textContent =
        state.toUpperCase() + '  ' + Story.Clock.label(clock.t) + '  ' + clock.format() + '\n' +
        'heading ' + s.heading + '  ordered ' + s.leg + (s.onCourse ? '  on course' : '  OFF course') + '\n' +
        'progress ' + s.progress + '\n' +
        'slip ' + s.slip + '  waiting ' + s.waiting + '\n' +
        'following fake ' + s.lure + '\n' +
        s.telexes + '\n' + s.sightings + '\n' +
        'lines queued ' + dialogue.queue.length + (dialogue.line ? '  showing ' + dialogue.line.entry.id : '');
    },

    toggle() {
      this.on = !this.on;
      if (!this.on && this.panel) this.panel.hidden = true;
    }
  };

  window.addEventListener('keydown', ev => {
    if (ev.key === '`' && !(ev.target.closest && ev.target.closest('input, textarea'))) debug.toggle();
  });

  toTitle();
  requestAnimationFrame(frame);
})();
