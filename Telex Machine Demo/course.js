/* ==================================================================
   TELEX — the courses the signals give
   ------------------------------------------------------------------
   The swept channel from the start to the beach, laid out as a chain
   of marks. It doesn't run straight at the beach: each leg swings
   the boat a different way, and only the last one points at the goal.

   A signal's text can carry any of these. When the slip prints, each
   is replaced with figures worked out from where the boat is then
   and which way she's heading:

     {HELM}      the full helm order: which way to turn the wheel,
                 how many degrees to come round, and the compass
                 course to stop on
     {COURSE}    the course for the next mark, in three figures: 062
     {MARK}      the name of the next mark: the Kwinte Buoy
     {MINUTES}   roughly how long that leg takes: 3 minutes

   The ship hands signals out in no fixed order, so none of them is
   tied to a leg. Whichever one prints gives the leg the boat is on.

   Run on its own (index.html, no ship), each print assumes the last
   order was steered exactly and moves on one leg, so the operator
   panel walks through the whole route.
   ================================================================== */

window.TELEX_COURSE = (function () {
'use strict';

/* In metres from where the boat starts, as the position indicator
   reads them: x is east, y is north. Keep them well west of the
   shoals off the French coast, which begin around x 2000 to 2300.
   The last mark is the goal. The ship passes its real position in,
   so these figures only stand in when the teleprinter runs alone. */
const MARKS = [
  { name: 'the last of the harbour buoys',  x:    0, y:  950 },   // 000
  { name: 'the North Goodwin light vessel', x: -300, y: 1750 },   // 339
  { name: 'the Kwinte Buoy',                x: 1100, y: 2600 },   // 059
  { name: 'the Zuydcoote Pass',             x: 1000, y: 3800 },   // 355
  { name: 'the beach at Malo-les-Bains',    x: 2493, y: 4585 }    // 062, the goal
];

const SPEED     = 7.7;   // metres a second, as the ship runs
const ARRIVE    = 350;   // this close to a mark, she's onto the next leg
const ON_COURSE = 2;     // degrees; any nearer and no turn is called for

const DEG   = 180 / Math.PI;
const TOKEN = /\{(HELM|COURSE|MARK|MINUTES)\}/gi;
const norm  = d => ((d % 360) + 360) % 360;
const three = d => String(Math.round(norm(d)) % 360).padStart(3, '0');

let leg = 0;                                  // the mark she's steering for
const alone = { x: 0, y: 0, heading: 0 };     // the pretend boat, with no ship

/* Has she reached this leg's mark, or gone past it? Past means over
   the line through the mark square to the leg, so a boat that's
   wandered off to one side still moves on. */
function done(n, at, marks) {
  const from = n ? marks[n - 1] : { x: 0, y: 0 };
  const to = marks[n];
  const lx = to.x - from.x, ly = to.y - from.y;
  const along = ((at.x - from.x) * lx + (at.y - from.y) * ly) / (lx * lx + ly * ly);
  return along >= 1 || Math.hypot(to.x - at.x, to.y - at.y) < ARRIVE;
}

/* The next leg from where she is. `turn` is degrees from her present
   heading, plus for starboard, minus for port. Rounded the way the
   binnacle reads, so the figures on the slip agree with the compass. */
function plot(ship) {
  const at = ship || alone;
  const marks = MARKS.slice();
  if (ship && ship.goal) {
    marks[marks.length - 1] = Object.assign({}, marks[marks.length - 1], ship.goal);
  }
  while (leg < marks.length - 1 && done(leg, at, marks)) leg++;

  const mark = marks[leg];
  const dx = mark.x - at.x, dy = mark.y - at.y;
  const course = Math.round(norm(Math.atan2(dx, dy) * DEG)) % 360;
  let turn = course - Math.round(norm(at.heading || 0)) % 360;
  if (turn > 180) turn -= 360;
  if (turn <= -180) turn += 360;

  return {
    leg: leg + 1,
    legs: marks.length,
    mark: mark,
    course: course,
    turn: turn,
    minutes: Math.max(1, Math.round(Math.hypot(dx, dy) / SPEED / 60))
  };
}

function helm(p) {
  const course = three(p.course);
  if (Math.abs(p.turn) < ON_COURSE) {
    return 'You are on course. Keep the wheel centred and the compass on ' + course + '.';
  }
  const side = p.turn > 0 ? 'starboard' : 'port';
  const hand = p.turn > 0 ? 'right' : 'left';
  return 'Turn ' + Math.abs(p.turn) + ' degrees to ' + side + '. Put the wheel over to the ' +
    hand + ' and hold it until the compass reads ' + course + ', then centre the wheel.';
}

/* Called by the machine as a slip prints. `ship` is { x, y, heading,
   goal: { x, y } } from the ship; leave it out to use the pretend boat. */
function fill(text, ship) {
  text = String(text);
  if (!text.match(TOKEN)) return text;
  const p = plot(ship);
  const words = {
    HELM:    helm(p),
    COURSE:  three(p.course),
    MARK:    p.mark.name,
    MINUTES: p.minutes + (p.minutes === 1 ? ' minute' : ' minutes')
  };

  if (!ship) {                                // steer it exactly, ready for the next print
    if (p.leg < p.legs) Object.assign(alone, { x: p.mark.x, y: p.mark.y, heading: p.course });
    else { Object.assign(alone, { x: 0, y: 0, heading: 0 }); leg = 0; }   // start over
  }
  return text.replace(TOKEN, (all, name) => words[name.toUpperCase()]);
}

return {
  fill: fill,
  plot: plot,       // the same figures as an object, for puzzle code
  marks: MARKS
};

})();
