/* ==================================================================
   TELEX — the courses the signals give
   ------------------------------------------------------------------
   The route from Ramsgate to the beaches, laid out as a chain of
   marks. It doesn't run straight at the beach: each leg swings the
   boat a different way, round the sands and out of range of the
   guns, and only the last leg points at the goal.

   A signal's text can carry any of these. When the slip prints, each
   is replaced with figures worked out from where the boat is then
   and which way she's heading:

     {HELM}      the wheel order: which way to turn, how many degrees,
                 and the compass course to stop on
     {TURN}      the turn on its own: 60 degrees to starboard
     {COURSE}    the course for the next mark, in three figures: 055
     {MARK}      the next mark's name: the Kwinte buoy
     {WHY}       one sentence on why this leg runs the way it does
     {POSITION}  where the mark lies on the position indicator:
                 X +0700 Y +1250
     {MINUTES}   roughly how long the leg takes: about 2 minutes

   The leg is always the one the boat is on: the first mark she hasn't
   reached yet. Once she reaches a mark, or goes past it, the next
   signal gives the next leg from wherever she actually is, which also
   corrects her if she has drifted.

   In the full game the Script sends signals 01 to 06 one at a time,
   each as the boat reaches the mark before (../Script/voyage.js).
   Run on its own (index.html, no ship), each print assumes the last
   order was steered exactly and moves on one leg, so printing from
   the operator panel walks you through the whole route.

   A signal with a STEER header (STEER: 150) gets that course in its
   {HELM}, {COURSE} and {TURN} instead of the route's. The Script uses
   it for forgeries that copy the look of a true order.
   ================================================================== */

window.TELEX_COURSE = (function () {
'use strict';

/* In metres from where the boat starts, as the position indicator
   reads them: x is east, y is north. The shoals off the French coast
   hold her at about x 2200 to 2350, so keep marks well west of that.
   The last mark is the goal. Move a mark and every signal follows,
   but keep the whole run short enough to sail inside the Script's
   ten minutes: as laid out, a perfect run arrives at about T+8:10.
   The courses noted are mark to mark; a boat that turns as she
   reaches each mark cuts the corners and steers a little less. */
const MARKS = [
  { name: 'the fairway buoy at the harbour mouth', x:    0, y: 1000,   // 000
    why: 'Follow the buoyed channel out of the harbour, with the red buoys to port and the green to starboard.' },
  { name: 'the Gull Stream buoy',                  x:  700, y: 1250,   // 070
    why: 'The Gull Stream is the deep-water channel inside the Goodwin Sands.' },
  { name: 'the North Goodwin light vessel',        x:  400, y: 1850,   // 333
    why: 'This leg takes you round the north end of the Goodwin Sands. The light vessel is painted red, with her name on her side.' },
  { name: 'the Kwinte buoy',                       x: 1200, y: 2050,   // 076
    why: 'The Kwinte buoy marks the swept channel across the middle of the Strait. Mines lie on either side of it.' },
  { name: 'the Zuydcoote Pass',                    x:  900, y: 2650,   // 333
    why: 'The guns at Gravelines cover the direct approach, so this leg holds you north, out of their range, until the pass.' },
  { name: 'the beach at Malo-les-Bains',           x: 1750, y: 3050,   // 065, the goal
    why: 'This is the last leg, in to the beach. The smoke over Dunkirk will be ahead of you.' }
];

const START     = { x: 0, y: 0 };
const SPEED     = 7.7;   // metres a second, as the ship runs
const ARRIVE    = 250;   // this close to a mark, she has reached it
const ON_COURSE = 3;     // degrees; any nearer and no turn is called for

const DEG   = 180 / Math.PI;
const NAMES = 'HELM|TURN|COURSE|MARK|WHY|POSITION|MINUTES';
const FIND  = new RegExp('\\{(' + NAMES + ')\\}', 'i');
const EVERY = new RegExp('\\{(' + NAMES + ')\\}', 'gi');
const norm  = d => ((d % 360) + 360) % 360;
const three = d => String(Math.round(norm(d)) % 360).padStart(3, '0');
const grid  = v => (v < 0 ? '-' : '+') + String(Math.abs(Math.round(v))).padStart(4, '0');

let leg = 0;                                  // the mark she's steering for
const alone = { x: 0, y: 0, heading: 0 };     // the pretend boat, with no ship

/* Has she reached mark n, or gone past it? Past means over the line
   through the mark square to the leg, so a boat that has wandered
   off to one side still moves on. */
function reached(n, at) {
  const from = n ? MARKS[n - 1] : START;
  const to = MARKS[n];
  const lx = to.x - from.x, ly = to.y - from.y;
  const along = ((at.x - from.x) * lx + (at.y - from.y) * ly) / (lx * lx + ly * ly);
  return along >= 1 || Math.hypot(to.x - at.x, to.y - at.y) < ARRIVE;
}

/* Degrees from `heading` round to `course`: plus for starboard, minus
   for port. Rounded the way the binnacle reads, so the figures on the
   slip agree with the compass. */
function turnFrom(heading, course) {
  let turn = Math.round(norm(course)) % 360 - Math.round(norm(heading || 0)) % 360;
  if (turn > 180) turn -= 360;
  if (turn <= -180) turn += 360;
  return turn;
}

/* The next leg from where she is. Calling it also notes any marks
   she has reached since last time, so call it as often as you like. */
function plot(ship) {
  const at = ship || alone;
  const last = MARKS.length - 1;
  while (leg < last && reached(leg, at)) leg++;

  const mark = MARKS[leg];
  const dx = mark.x - at.x, dy = mark.y - at.y;
  const metres = Math.hypot(dx, dy);
  const course = Math.round(norm(Math.atan2(dx, dy) * DEG)) % 360;

  return {
    leg: leg + 1,
    legs: MARKS.length,
    mark: mark,
    course: course,
    turn: turnFrom(at.heading, course),
    metres: Math.round(metres),
    arrived: leg === last && metres < ARRIVE   // at the goal itself
  };
}

function helm(p) {
  const course = three(p.course);
  if (p.arrived) {
    return 'You have reached ' + p.mark.name + '. Put the wheel a little over and leave it ' +
      'there, so she circles slowly in deep water while the troops come out to you.';
  }
  if (Math.abs(p.turn) < ON_COURSE) {
    return 'You are on course. Keep the wheel in the middle, with the rudder needle ' +
      'upright, and the compass on ' + course + '.';
  }
  const side = p.turn > 0 ? 'starboard' : 'port';
  const hand = p.turn > 0 ? 'right' : 'left';
  return 'Turn ' + Math.abs(p.turn) + ' degrees to ' + side + '. Put the wheel over to the ' +
    hand + ' and hold it there until the compass reads ' + course +
    ', then bring the wheel back to the middle.';
}

function minutes(metres) {
  const m = Math.round(metres / SPEED / 60);
  return m < 1 ? 'under a minute' : 'about ' + m + (m === 1 ? ' minute' : ' minutes');
}

function render(text, p) {
  const words = {
    HELM:     helm(p),
    TURN:     p.arrived || Math.abs(p.turn) < ON_COURSE ? 'no turn'
              : Math.abs(p.turn) + ' degrees to ' + (p.turn > 0 ? 'starboard' : 'port'),
    COURSE:   three(p.course),
    MARK:     p.mark.name,
    WHY:      p.mark.why,
    POSITION: 'X ' + grid(p.mark.x) + ' Y ' + grid(p.mark.y),
    MINUTES:  minutes(p.metres)
  };
  return text.replace(EVERY, (all, name) => words[name.toUpperCase()]);
}

/* With no ship, the pretend boat steers this order exactly: she ends
   up on the mark, heading the course she was given. After the goal
   she starts the route again. */
function walk(p) {
  if (p.leg < p.legs) Object.assign(alone, { x: p.mark.x, y: p.mark.y, heading: p.course });
  else { Object.assign(alone, START, { heading: 0 }); leg = 0; }
}

/* Fill in a piece of text. `ship` is { x, y, heading }, in metres
   from the start as the position indicator reads them; leave it out
   to use the pretend boat, which then counts this as one print. */
function fill(text, ship) {
  text = String(text);
  if (!FIND.test(text)) return text;
  const p = plot(ship);
  if (!ship) walk(p);
  return render(text, p);
}

/* Called by the machine as a slip prints. Works the figures out once
   and writes them into sig.body, so the slip, the enlarged sheet and
   the log all read the same. The text as written is kept in
   sig.template, so the signal can print again later with new figures.
   The figures themselves go on sig.plot, for puzzle code. */
function stamp(sig, ship) {
  if (!sig) return sig;
  if (sig.template === undefined) sig.template = String(sig.body || '');
  if (!FIND.test(sig.template)) return sig;
  let p = plot(ship);
  const steer = parseInt(sig.steer, 10);
  if (isNaN(steer)) {
    if (!ship) walk(p);
  } else {                                    // a set course, not the route's
    p = Object.assign({}, p, { course: norm(steer), turn: turnFrom((ship || alone).heading, steer), arrived: false });
  }
  sig.body = render(sig.template, p);
  sig.plot = {
    leg: p.leg, legs: p.legs, mark: p.mark.name, course: three(p.course),
    turn: p.turn, metres: p.metres, arrived: p.arrived
  };
  return sig;
}

return {
  stamp: stamp,
  fill: fill,
  plot: plot,       // the next leg as an object, for puzzle code
  marks: MARKS,
  arrive: ARRIVE
};

})();
