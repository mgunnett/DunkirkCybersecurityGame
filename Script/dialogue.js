/* ==================================================================
   DUNKIRK — the script, as data
   ------------------------------------------------------------------
   Every line the game says, every telex it sends and every sighting
   it sets up is in this file. Writers can change any of it without
   touching the code. See README.md for what each field means.

   Times are written 'T+M:SS': real minutes and seconds after the
   Kestrel leaves Ramsgate. One real second is one minute of the
   voyage, so T+3:15 is 08:15 on the in-game clock.

   Two characters to keep out of any text: a backtick, and a dollar
   sign followed by {. Both end the text early.
   ================================================================== */

window.STORY_DATA = {

  // ---- The voyage -----------------------------------------------------------
  voyage: {
    start:    '05:00',   // in-game clock when the Kestrel leaves Ramsgate
    length:   780,       // real seconds until 18:00, when it's too late
    date:     '30 MAY 40',

    // How close to the ordered course counts as "on course", in degrees either side
    tolerance: 20,

    // The route is a chain of marks in Telex Machine Demo/course.js. The voyage is won
    // by reaching the last of them, the beach.

    // Signals marked number: true get the next serial and a time of origin `ago`
    // in-game minutes before they print. These carry on from TX-K1, the last fixed one.
    numbering: { lastSerial: 34, lastTime: '05:15', ago: 5 },

    // Within this many metres of the beach, Tom sees the men waiting (goal:near)
    goalNear: 700,
    // A buoy or light vessel on a route mark is missed this many seconds after she
    // passes the mark, and counts as missed off course if she never came this close
    sightingGrace: 20,
    sightingRange: 1500,

    // A false order is "followed" after this many seconds on its course...
    followAfter: 5,
    // ...and "refused" this many seconds after it was read, if not followed.
    refuseAfter: 20,
    // A true order is "followed" after this many seconds on its course.
    trustAfter: 3,

    // Holding a false order's course this long ends the game (lured / turned back)
    luredAfter: 30,

    // Off-course reminders, in seconds off course without a break
    offCourseWarn: 15,
    offCourseUrgent: 40,
    // No off-course nagging for this long after a new course is ordered
    newCourseGrace: 45,  // long enough to decode an order in cipher
    // "There's a message waiting" after the slip has lain unread this long
    unreadWarn: 20,
    // Seconds between a slip being put down and the next one printing
    telexGap: 3
  },

  // Names shown above each line. Narrator lines have no name.
  speakers: {
    Narrator: '',
    Hartley:  'Mr. Hartley',
    Graves:   'Lt. Cdr. Graves',
    Tom:      'Tom Lacey',
    Skipper:  'You'
  },

  // ---- Every line, in the order it's written ---------------------------------
  // trigger.type 'event' values the game sends:
  //   intro, ending:victory, ending:outOfTime, ending:lured, ending:turnedBack
  //   TX-nn:arrived, TX-nn:read, TX-nn:trust, TX-nn:reject
  //   BN-nn:spotted, BN-nn:missed, BN-nn:missedOffCourse   (buoys)
  //   BN-nn:overhead, BN-nn:correct, BN-nn:wrong, BN-nn:missed   (aircraft)
  //   BN-nn:reported                                       (a German aircraft reported on the telex)
  //   remind:unread, remind:offCourse, remind:offCourseUrgent
  //   mark:n (the boat has reached route mark n), goal:near
  // Telexes and sightings can also wait for a leg of the route,
  // { type: 'leg', value: 3 }, or follow an event after a delay,
  // { type: 'after', value: 'TX-06:read', delay: 12 }. See voyage.js.
  //
  // TX-01 to TX-06 are the true orders, one for each leg of the route. Their
  // words are the signal files of the same number in Telex Machine Demo/signals,
  // and their courses are worked out from where the boat is as each one prints.
  //
  // Telex headers beyond the usual ones (see Telex Machine Demo/README.md):
  //   GENUINE, CLUE n, LESSON   the cipher desk's "Is this signal genuine?" and its debrief.
  //                             Never printed on the slip; shown only after the player answers.
  //   KEY, KEY NAME             a key, filed in the desk's key tray
  //   CIPHER, KEYWORD, KEY NAME printed enciphered; the player decodes it on the desk
  // A telex built from a signal file, a replay or a tamper takes these as `headers`.
  lines: [

    // ==== Act 0: The call and the briefing (clock stopped) ======================
    // All CLICK, so students read at their own pace.

    { id: 'I-01', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      scene: 'Kent coast · 29 May 1940 · Evening',
      text: 'The Kent coast. 29 May 1940. The telephone rings.' },
    { id: 'I-02', speaker: 'Hartley', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'Good evening. Am I speaking with the owner of the motor yacht Kestrel?' },
    { id: 'I-03', speaker: 'Skipper', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: '',
      choices: [
        { label: 'A', text: '“You are. Who’s asking?”' },
        { label: 'B', text: '“Depends who wants to know.”' }
      ] },
    { id: 'I-04', speaker: 'Hartley', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'Hartley, Ministry of Shipping. I’m afraid the Ministry needs your boat. Tonight.' },
    { id: 'I-05', speaker: 'Skipper', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: '',
      choices: [
        { label: 'A', text: '“Needs her? What for?”' },
        { label: 'B', text: '“Nobody sails the Kestrel but me.”' }
      ] },
    { id: 'I-06', speaker: 'Hartley', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'I can’t say much over the telephone. Anyone could be listening.' },
    { id: 'I-07', speaker: 'Hartley', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: '…Very well. If you insist on sailing her yourself, we can’t refuse an experienced hand. Report to Ramsgate harbour by half past four in the morning.' },
    { id: 'I-08', speaker: 'Hartley', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'And bring a warm coat. It’s a long day on the Channel.' },

    { id: 'I-09', speaker: 'Graves', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      scene: 'Ramsgate harbour · 30 May 1940 · 04:30',
      text: 'You’re the Kestrel? Good. Here’s the situation. Over three hundred thousand of our soldiers are trapped on the beaches at Dunkirk.' },
    { id: 'I-10', speaker: 'Graves', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'The big ships can’t get close to shore. We need small boats like yours to ferry the men out.' },
    { id: 'I-11', speaker: 'Graves', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'You’ll sail on your own. The Vice-Admiral at Dover will send your course orders by teleprinter, one signal at a time.' },
    { id: 'I-12', speaker: 'Graves', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'Now listen carefully. The enemy listens to our traffic and knows its forms. He’ll send signals of his own, made to look like ours, to lead you onto the mines or under his guns.' },
    { id: 'I-13', speaker: 'Graves', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      onShow: 'openRulebook', onDone: 'closeRulebook',
      text: 'This is your rulebook. Learn it. Nobody out there will check your signals for you, and a signal that fails even one check is to be ignored.' },
    { id: 'I-13b', speaker: 'Graves', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'Some orders will come in cipher, under a key Dover sends you. Guard that key. Whoever holds it can write orders that read just like ours.' },
    { id: 'I-14', speaker: 'Graves', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'This is Able Seaman Lacey. He’s going with you.' },
    { id: 'I-15', speaker: 'Tom', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'Tom, sir. Er, Skipper. I’ve never been past the harbour wall, if I’m honest.' },
    { id: 'I-16', speaker: 'Graves', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'You have until six tonight to reach the beaches. Any later and there may be no one left to bring home. Good luck.' },
    { id: 'I-17', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'Steer with the WHEEL and watch your course on the COMPASS. Look about with the BINOCULARS. Read your orders on the TELEX, and check each one against the RULEBOOK. Every slip you read is filed on the CIPHER DESK.' },
    { id: 'I-18', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      onDone: 'startVoyage',
      text: '05:00. The Kestrel leaves Ramsgate.' },

    // ==== Act 1: Leaving England (legs 1 and 2: out of the harbour, the Gull Stream) ====

    { id: 'V-01', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'time', value: 'T+0:03' },
      text: 'So, Skipper… which way is France?' },
    { id: 'V-02', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'time', value: 'T+0:08' },
      text: 'The telex is warming up. Dover should send our first orders soon.' },

    { id: 'TX-00', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+0:15' },
      correctAction: 'trust',
      concept: 'Know what normal looks like. Every later signal is compared with this one.',
      text: `
SERIAL:   NR 033
PRIORITY: ROUTINE
TIME:     0510Z/30 MAY 40
GENUINE:  yes
CLUE 1:   FM V.A. DOVER (DYNAMO) | The station that sends all your orders, spelled correctly.
CLUE 2:   TO M.Y. KESTREL | Addressed to you, by name.
CLUE 3:   NR 033 · 0510Z | Remember the number and the time. Every true signal after this one carries a higher number and a later time.
LESSON:   Know what normal looks like. You can only spot a fake if you know the real thing well.
---
Test of line. This machine will carry your orders for the
crossing. Check every signal against your handbook before you
act on it.
` },
    { id: 'V-03', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-00:arrived' },
      text: 'There it goes! Something’s coming through.' },
    { id: 'V-04', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-00:read' },
      text: 'Just Dover testing the line. Not much to it… though I suppose it’s worth remembering what a real one looks like.' },

    { id: 'TX-K1', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+0:25' },
      correctAction: 'trust',
      concept: 'Keys: the key travels on its own, apart from the messages it unlocks.',
      text: `
SERIAL:   NR 034
PRIORITY: IMMEDIATE
TIME:     0515Z/30 MAY 40
KEY:      DYNAMO
KEY NAME: DAY KEY 30 MAY
GENUINE:  yes
CLUE 1:   FM V.A. DOVER (DYNAMO) | The right sender, with the next number in the run after NR 033.
CLUE 2:   Valid for traffic dated 30 May only | A key with a fixed lifetime limits the damage if it is captured. Keys change on a schedule, not because a message says so.
CLUE 3:   It asks you for nothing | A genuine key signal hands something over. It never asks you to send a secret back.
LESSON:   Whoever holds the key can read your traffic and write traffic that looks as if it came from Dover. Guard it like the ship’s papers.
---
Day key for enciphered traffic. Valid for traffic dated 30 May
only. Signals marked DAY KEY 30 MAY are to be read with the key
group below. Do not repeat this key by any means.
` },
    { id: 'V-04b', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'TX-K1:read' },
      text: '“Do not repeat this key by any means.” Sounds important.' },

    // Leg 1, out through the harbour channel
    { id: 'TX-01', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+0:35' },
      correctAction: 'trust', signal: '01-sailing-orders', number: true,
      concept: 'A true message passes every check.',
      headers: `
GENUINE:  yes
CLUE 1:   FM V.A. DOVER (DYNAMO) · TO M.Y. KESTREL | The right sender, and meant for you.
CLUE 2:   Its number and time | Both run on from the day key: the number has gone up and the time is later. Signals run in order.
CLUE 3:   Next mark | The order names a mark you can check for yourself through the binoculars when you get there.
LESSON:   A true signal passes every check: who sent it, who it is for, its number, its time, and whether the order makes sense.
` },
    { id: 'V-05', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-01:read' },
      text: 'Our first real orders. Your call, Skipper.' },
    { id: 'V-05b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'TX-01:trust' },
      text: 'And we’re off. France, here we come.' },

    { id: 'V-06', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'time', value: 'T+1:10' },
      text: 'Look at all the boats, Skipper. Fishing boats, yachts, even a paddle steamer from the Thames.' },

    // The first aircraft of the day, and Tom's reminder of WEFT
    { id: 'BN-05', speaker: 'Binoculars', mode: 'SPOT', trigger: { type: 'time', value: 'T+1:25' },
      sighting: { kind: 'aircraft', aircraft: 'hurricane' },
      text: 'A Hawker Hurricane crosses ahead. Thick wings with rounded tips, one engine, a big radiator under the belly, roundels.' },
    { id: 'V-18', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-05:overhead' },
      text: 'Hear that? Engines. Aircraft!' },
    { id: 'V-19', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-05:overhead' },
      text: 'Ours or theirs? Remember your WEFT.' },
    { id: 'V-19a', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-05:correct' },
      text: 'One of ours. That’s a weight off.' },
    { id: 'V-19b', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'BN-05:wrong' },
      text: 'German? It went straight past the boats without a second look.' },
    { id: 'V-19i', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-05:missed' },
      text: 'Gone. Whoever it was.' },

    // Leg 2, sent as she reaches the fairway buoy
    { id: 'TX-02', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'leg', value: 2 },
      correctAction: 'trust', signal: '02-route-x', number: true,
      concept: 'A true change of orders says plainly why.',
      headers: `
GENUINE:  yes
CLUE 1:   Its number and time | Both run on in order from Dover’s last signal.
CLUE 2:   Route Z is under fire | It says plainly why the route is changing, and the reason fits what you know of the coast.
CLUE 3:   Keep to the swept water | It keeps you clear of the mines and the guns, not closer to them.
LESSON:   A true change of orders says why, and still passes every check. A change of plan is not suspicious in itself; a change you can’t account for is.
` },
    { id: 'V-14', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-02:read' },
      text: 'A new course already. Dover’s keeping us busy.' },
    { id: 'V-14b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'TX-02:trust' },
      text: 'Steady as she goes.' },

    { id: 'TX-07', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+1:50' },
      correctAction: 'reject', lureHeading: 180, lure: 'lured', number: true,
      fails: ['1. Who sent it?', '5. Does the order make sense?'],
      concept: 'Spoofing: a lookalike sender, like a fake email address one letter off. It copies the look of a true order, wheel order and all.',
      text: `
PRIORITY: IMMEDIATE
FROM:     V.A. DOVRE (DYNAMO)
STEER:    180
GENUINE:  no
CLUE 1:   FM V.A. DOVRE (DYNAMO) | DOVRE, not DOVER. A lookalike sender, one letter off, is the oldest trick there is. Read the sender letter by letter.
CLUE 2:   The compass reads 180 | Due south, towards Calais and the enemy guns on that coast.
CLUE 3:   An escort will meet you | A promise that makes a strange order feel safe. Nothing on the slip lets you check it.
LESSON:   This is spoofing: a message made to look as if it came from someone you trust, like an email from an address one letter off. The number and time can be perfect and the sender still false.
---
Route X closed by mines. Small craft are to make for Calais
Roads, where an escort will meet you and take you in.

{HELM}
` },
    { id: 'V-07', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-07:read' },
      text: 'Mines on our route? And an escort waiting for us. That’s good of them… isn’t it?' },
    { id: 'V-08', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'TX-07:reject' },
      text: 'We’re not turning? …Oh. DOVRE. I read straight past that.' },
    { id: 'V-09', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'TX-07:trust' },
      text: 'Calais, then. If you’re sure, Skipper.' },

    { id: 'V-10', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'time', value: 'T+2:30' },
      text: 'Skipper, how do we know we’re really where Dover thinks we are?' },
    { id: 'V-11', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'time', value: 'T+2:36' },
      text: 'Out here every bit of sea looks the same as the last.' },

    // Leg 3, sent as she reaches the Gull Stream buoy. The light vessel lies on its mark.
    { id: 'TX-03', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'leg', value: 3 },
      correctAction: 'trust', signal: '03-the-beaches', number: true,
      concept: 'A true change of orders says plainly why.',
      headers: `
GENUINE:  yes
CLUE 1:   Its number and time | Both run on in order from Dover’s last signal.
CLUE 2:   The eastern mole is crowded with destroyers | It says plainly why small craft are sent to the beaches instead.
CLUE 3:   Bear away from the shore | Careful advice that keeps you safe. It asks for nothing secret and nothing risky.
LESSON:   A true change of orders says why, and still passes every check. A change of plan is not suspicious in itself; a change you can’t account for is.
` },
    { id: 'V-14c', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-03:read' },
      text: 'Back the other way? We’re zig-zagging all over the Channel.' },

    { id: 'BN-01', speaker: 'Binoculars', mode: 'SPOT', trigger: { type: 'leg', value: 3 },
      sighting: { kind: 'mark', art: 'lightvessel', mark: 3, w: 34, h: 14 },
      text: 'The North Goodwin light vessel, red, with N. GOODWIN on her side, lying where the orders put her.' },
    { id: 'V-12', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'BN-01:spotted' },
      text: 'North Goodwin! So that’s where we are.' },
    { id: 'V-13', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-01:missedOffCourse' },
      text: 'Nothing out there but open water.' },
    { id: 'V-13b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-01:missed' },
      text: 'Was there something back there? I couldn’t say.' },

    // ==== Act 2: Open water (legs 3 to 5: round the Goodwins, the Kwinte buoy) ====

    { id: 'BN-06', speaker: 'Binoculars', mode: 'SPOT', trigger: { type: 'time', value: 'T+3:45' },
      sighting: { kind: 'aircraft', aircraft: 'bf109' },
      text: 'A Messerschmitt Bf 109 crosses ahead. Straight wings with square-cut tips, one engine, black crosses. Easily taken for a Spitfire.' },
    { id: 'V-19c', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'BN-06:overhead' },
      text: 'Another one, low and fast. Looks a lot like the last one, Skipper.' },
    { id: 'V-19d', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-06:correct' },
      text: 'A Messerschmitt. Hunting, by the look of it.' },
    { id: 'V-19e', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'BN-06:wrong' },
      text: 'One of ours? Then why’s it going for the boats behind us?' },
    { id: 'V-19f', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-06:missed' },
      text: 'Gone before I got a proper look.' },
    { id: 'V-19g', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-06:reported' },
      text: 'Dover knows. Maybe the RAF can catch it.' },

    { id: 'TX-08', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+4:00' },
      correctAction: 'reject', lureHeading: 270, lure: 'turnedBack',
      fails: ['1. Who sent it?', '2. Is it for us?', '3. Does the number fit?', '4. Does the time fit?', '5. Does the order make sense?'],
      concept: 'Phishing and social engineering: urgency, a big name, and “no time to check”.',
      text: `
PRIORITY: URGENT
TIME:     9 O'CLOCK
FROM:     FIRST LORD OF THE ADMIRALTY
TO:       ALL SMALL CRAFT
SIGN:     OBEY AT ONCE.
GENUINE:  no
CLUE 1:   FM FIRST LORD OF THE ADMIRALTY | A big name, but your orders come from Dover. The First Lord doesn’t send course orders to yachts.
CLUE 2:   TO ALL SMALL CRAFT | Not addressed to you. Every true order is sent to M.Y. KESTREL.
CLUE 3:   No number · TOO 9 O'CLOCK | No serial at all, and a time in a form Dover never uses.
CLUE 4:   Report your position by wireless | It wants you to break wireless silence and tell the enemy where you are.
CLUE 5:   No time to check this signal | Invented urgency stops you checking. Real orders leave time to verify.
LESSON:   This is phishing and social engineering: an important name, urgency, a threat and a request for something secret. The harder a message pushes you not to check it, the more it needs checking.
---
Urgent urgent. Mines ahead on every route. Turn back to
Ramsgate immediately. Report your position by wireless at
once. No time to check this signal.
` },
    { id: 'V-15', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-08:read' },
      text: 'The First Lord of the Admiralty! That’s the top of the whole Navy. We have to turn back… don’t we?' },
    { id: 'V-16', speaker: 'Tom', mode: 'AUTO', duration: 7, trigger: { type: 'event', value: 'TX-08:reject' },
      text: 'You’re ignoring the First Lord? …I hope you know what you’re doing, Skipper.' },
    { id: 'V-17', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-08:trust' },
      text: 'Skipper, we’re heading home. The men on the beach are still waiting for us…' },

    // Leg 4, sent as she reaches the North Goodwin light vessel, in cipher under the day
    // key (TX-K1). The Kwinte buoy lies on its mark.
    { id: 'TX-04', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'leg', value: 4 },
      correctAction: 'trust', signal: '04-air-attack', number: true,
      concept: 'A true change of orders says plainly why. The first order in cipher, under the day key (TX-K1).',
      headers: `
CIPHER:   VIGENERE
KEYWORD:  DYNAMO
KEY NAME: DAY KEY 30 MAY
GENUINE:  yes
CLUE 1:   Reads plainly under the day key | Only someone holding Dover’s key could write a message that decodes to sense with it.
CLUE 2:   Its number and time | Both run on from Dover’s last signal.
CLUE 3:   Look at any aircraft through the binoculars | Sound advice. It asks for nothing secret and nothing risky.
LESSON:   Encryption does two jobs. It hides a message from the enemy, and it shows the message came from someone who holds the key.
` },
    { id: 'V-14d', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-04:read' },
      text: 'Can’t make head nor tail of this one, Skipper.' },
    { id: 'V-14e', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'TX-04:trust' },
      text: 'Good thing we kept that key.' },

    { id: 'BN-03', speaker: 'Binoculars', mode: 'SPOT', trigger: { type: 'leg', value: 4 },
      sighting: { kind: 'mark', art: 'kwinte', mark: 4, w: 5, h: 10 },
      text: 'The Kwinte Buoy, green and white, marked KWINTE, lying where the orders put it.' },
    { id: 'V-26', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-03:spotted' },
      text: 'KWINTE, it says. That’s the one.' },
    { id: 'V-26b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-03:missedOffCourse' },
      text: 'No buoy anywhere. Are we where we ought to be?' },
    { id: 'V-26c', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-03:missed' },
      text: 'We’ve gone past the Kwinte Buoy without a look at it.' },

    { id: 'BN-02', speaker: 'Binoculars', mode: 'SPOT', trigger: { type: 'time', value: 'T+4:50' },
      sighting: { kind: 'aircraft', aircraft: 'spitfire' },
      text: 'A Spitfire crosses ahead. Rounded wings, one engine, red, white and blue roundels. Click it and choose German or Allied.' },
    { id: 'V-19h', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-02:overhead' },
      text: 'There’s another, Skipper. High up this time.' },
    { id: 'V-20', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-02:correct' },
      text: 'One of ours! The RAF is watching over the beaches.' },
    { id: 'V-21', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'BN-02:wrong' },
      text: 'German? Are you sure? That’s not what I saw.' },
    { id: 'V-21b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-02:missed' },
      text: 'It’s gone. We never got a proper look at it.' },

    { id: 'TX-09', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+5:15' },
      correctAction: 'trust', number: true,
      concept: 'Security warnings: a true signal can tell you to stay alert, without changing your orders.',
      text: `
PRIORITY: IMMEDIATE
GENUINE:  yes
CLUE 1:   Its number and time | Both run on in order from Dover’s last signal.
CLUE 2:   No change to your orders | A genuine warning asks you to be careful. It doesn’t ask you to do anything new or risky.
LESSON:   Security warnings are real traffic too. Expect the enemy to use a warning like this as cover for the very trick it warns you about.
---
Warning. Enemy is sending false signals in our name to small
craft on all routes. Check every signal against your handbook.
No change to your orders.
` },
    { id: 'V-22', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-09:read' },
      text: 'So that’s what’s been going on.' },

    { id: 'TX-K2', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+5:40' },
      correctAction: 'reject', number: true,
      fails: ['5. Does the order make sense?'],
      concept: 'Key substitution: get the victim to swap their key for yours, and every forgery afterwards decodes perfectly.',
      text: `
PRIORITY: MOST IMMEDIATE
KEY:      SEAGULL
KEY NAME: REPLACEMENT KEY
SIGN:
GENUINE:  no
CLUE 1:   Day key compromised | Keys change on a schedule and by a separate route. A key change announced on the same line as the orders is exactly what someone forging orders would send.
CLUE 2:   Discard it at once | It wants you to throw away the one thing that lets you tell Dover’s traffic from the enemy’s.
CLUE 3:   Do not confirm by lamp | Being told not to check is the strongest red flag of all. A genuine sender wants to be checked.
CLUE 4:   Just after Dover’s warning | The number and time fit perfectly. It hides behind the real warning about false signals.
LESSON:   This is a key substitution attack. Swap your key for theirs and every forged order afterwards decodes perfectly. Only accept a new key by the route that brought the old one, and confirm it before you use it.
---
Day key compromised. Discard it at once and use the
replacement key below for all traffic from this signal on.
Do not confirm by lamp. The enemy is reading lamps.
` },
    { id: 'V-22b', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-K2:read' },
      text: 'A new key already? Dover’s being careful, I’ll give them that.' },
    { id: 'V-22c', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'TX-K2:reject' },
      text: 'Keeping the old key, then. Right you are.' },
    { id: 'V-22d', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'TX-K2:trust' },
      text: 'Out with the old key, in with the new.' },

    // Leg 5, sent as she reaches the Kwinte buoy
    { id: 'TX-05', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'leg', value: 5 },
      correctAction: 'trust', signal: '05-homeward', number: true,
      concept: 'A true change of orders says plainly why.',
      headers: `
GENUINE:  yes
CLUE 1:   Its number and time | Both run on in order from Dover’s last signal.
CLUE 2:   Do not leave the swept water | It keeps you clear of the mines, not closer to them.
CLUE 3:   The mark lies at | It tells you where the next mark is, so you can check it on your position indicator.
LESSON:   A true signal passes every check: who sent it, who it is for, its number, its time, and whether the order makes sense.
` },

    // An earlier true order, sent again word for word: the one furthest off her course now
    { id: 'TX-10', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+6:00' },
      correctAction: 'reject', replay: true, lure: 'lured',
      fails: ['3. Does the number fit?', '4. Does the time fit?'],
      concept: 'Replay attack: an old, real message recorded and sent again.',
      headers: `
GENUINE:  no
CLUE 1:   Its number | You already hold a signal with this number. The numbers have run on since; one can’t go backwards.
CLUE 2:   Its time of origin | Hours old by now.
CLUE 3:   Its course | An earlier leg of the route. Dover has moved you on since.
LESSON:   This is a replay attack: a real signal, recorded and sent again later. Everything about it was once genuine, which is why the number and the time are the checks that catch it.
` },
    { id: 'V-23', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-10:read' },
      text: 'These orders again? Maybe Dover wants us back on the old course.' },
    { id: 'V-24', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'TX-10:reject' },
      text: 'Not turning? Hm. Something about it did feel familiar.' },
    { id: 'V-25', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'TX-10:trust' },
      text: 'Funny. I could swear we’ve done this bit before.' },

    // A forged order, enciphered under the forged key (TX-K2)
    { id: 'TX-12', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+6:25' },
      correctAction: 'reject', lureHeading: 110, lure: 'lured', number: true,
      fails: ['5. Does the order make sense?'],
      concept: 'A forged order under the forged key (TX-K2): it decodes perfectly, but only under a key that came from the enemy.',
      text: `
PRIORITY: MOST IMMEDIATE
CIPHER:   VIGENERE
KEYWORD:  SEAGULL
KEY NAME: REPLACEMENT KEY
GENUINE:  no
CLUE 1:   Nonsense under the day key | Decoded with Dover’s key it is gibberish, so whoever wrote it does not hold that key.
CLUE 2:   CYP REPLACEMENT KEY | It only reads under the key from the signal that told you to throw Dover’s away.
CLUE 3:   Steer one one zero | East-south-east, out of the swept water and towards the French coast.
CLUE 4:   Break wireless silence | Transmitting would tell the enemy exactly where you are.
LESSON:   A message that decodes is only as trustworthy as the key that decodes it. Ask where the key came from, not just whether the message reads.
---
Kwinte channel blocked by a sunken trawler. Steer one one zero
degrees for the Zuydcoote Pass. Break wireless silence on
arrival and report your position.
` },
    { id: 'V-25b', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 4, trigger: { type: 'event', value: 'TX-12:read' },
      text: 'More code, Skipper.' },
    { id: 'V-25c', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'TX-12:reject' },
      text: 'Not that way, then. Fine by me.' },
    { id: 'V-25d', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'TX-12:trust' },
      text: 'Zuydcoote it is. Bit close to the shore, isn’t it?' },

    // ==== Act 3: The beaches (leg 6: from the Zuydcoote Pass to the beach) ==========

    // Leg 6, sent as she reaches the Zuydcoote Pass, in cipher under the day key
    { id: 'TX-06', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'leg', value: 6 },
      correctAction: 'trust', signal: '06-recall', number: true,
      concept: 'Encryption hides a message, and shows it came from someone who holds the key.',
      headers: `
CIPHER:   VIGENERE
KEYWORD:  DYNAMO
KEY NAME: DAY KEY 30 MAY
GENUINE:  yes
CLUE 1:   Reads plainly under the day key | Only someone holding Dover’s key could write a message that decodes to sense with it. The cipher proves who sent it as well as hiding what it says.
CLUE 2:   Its number and time | Both run on from Dover’s genuine traffic.
CLUE 3:   Next mark: the beach | The last leg, in to the beach, inside the swept water.
LESSON:   Encryption does two jobs. It hides a message from the enemy, and it shows the message came from someone who holds the key. A message is only as trustworthy as the key it reads under.
` },
    { id: 'V-27', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-06:read' },
      text: 'Code again. Is this the last of them, d’you think?' },
    { id: 'V-28', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'TX-06:trust' },
      text: 'Not far now.' },

    // TX-06 again, same number and time, in clear, with its course changed
    { id: 'TX-11', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'after', value: 'TX-06:read', delay: 12 },
      correctAction: 'reject', tamper: 'TX-06', lure: 'lured',
      fails: ['3. Does the number fit?', '5. Does the order make sense?'],
      concept: 'Tampering: a true message changed on its way to you (a man-in-the-middle).',
      headers: `
GENUINE:  no
CLUE 1:   Its number and time | The same as the order that has just come in. One signal can’t arrive twice with a different course.
CLUE 2:   Sent in clear | The real one came in cipher under the day key. A message in cipher can’t be altered without the key; one in clear can be changed by anybody.
CLUE 3:   Its course | One figure changed, so it no longer points at the beach.
LESSON:   This is tampering, a man-in-the-middle attack: a true message caught on its way and changed. Compare it with what you already hold, and trust the copy that only Dover’s key could have written.
` },
    { id: 'V-29', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-11:read' },
      text: 'Another one already? Dover’s busy today.' },
    { id: 'V-30', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'TX-11:reject' },
      text: 'Holding course? Fair enough. You’ve not been wrong yet.' },
    { id: 'V-31', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'TX-11:trust' },
      text: 'That’s a sharp turn, Skipper. Are the beaches really that way?' },

    { id: 'BN-07', speaker: 'Binoculars', mode: 'SPOT', trigger: { type: 'time', value: 'T+6:10' },
      sighting: { kind: 'aircraft', aircraft: 'he111' },
      text: 'A Heinkel He 111 crosses ahead. Broad wings, two engines, a glazed nose, black crosses. A bomber.' },
    { id: 'V-31a', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'BN-07:overhead' },
      text: 'Listen to that drone. That’s a big one.' },
    { id: 'V-31b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-07:correct' },
      text: 'A bomber. And it’s heading for the beaches.' },
    { id: 'V-31c', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'BN-07:wrong' },
      text: 'Ours? Then what’s it doing turning in over the town?' },
    { id: 'V-31d', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'BN-07:missed' },
      text: 'It’s gone over. Towards Dunkirk, by the sound of it.' },
    { id: 'V-31e', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'BN-07:reported' },
      text: 'Dover knows. Let’s hope the fighters get to it first.' },

    { id: 'V-32', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'time', value: 'T+6:40' },
      text: 'Skipper… look at the horizon. All that black smoke. Is that Dunkirk?' },

    { id: 'BN-04', speaker: 'Binoculars', mode: 'SPOT', trigger: { type: 'time', value: 'T+7:15' },
      sighting: { kind: 'aircraft', aircraft: 'stuka' },
      text: 'A Stuka crosses ahead. Bent wings, wheels fixed down, black crosses. Click it and choose German or Allied.' },
    { id: 'V-32b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-04:overhead' },
      text: 'Another one! Coming in low over the water.' },
    { id: 'V-33', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'BN-04:correct' },
      text: 'One of theirs. Keep her steady, Skipper. We’re nearly there.' },
    { id: 'V-34', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'BN-04:wrong' },
      text: 'One of ours? Then why is it diving at the boats?' },
    { id: 'V-34r', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-04:reported' },
      text: 'Dover knows about it now. Someone’ll go after it.' },
    { id: 'V-34b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-04:missed' },
      text: 'It’s gone over. I never saw whose it was.' },

    { id: 'V-35', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'goal:near' },
      text: 'I can see them. Lines of men, all the way down the beach, standing in the water. Waiting.' },
    { id: 'V-36', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'goal:near' },
      text: 'Bring her in slow, Skipper. Mind the shallows.' },

    // ==== Reminders (any time) ==================================================

    { id: 'R-01', speaker: 'Tom', mode: 'AUTO', duration: 3, trigger: { type: 'event', value: 'remind:unread' },
      text: 'There’s a message waiting on the telex, Skipper.' },
    { id: 'R-02', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'remind:offCourse' },
      text: 'The compass doesn’t match our orders, Skipper.' },
    { id: 'R-03', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'remind:offCourseUrgent' },
      text: 'We’re drifting badly. If we don’t correct now, we’ll never make it.' },
    { id: 'R-04', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'time', value: 'T+11:00' },
      text: 'Two hours to go, Skipper. We have to keep moving.' },

    // ==== Endings (clock stopped, all CLICK) ====================================
    // {time}, {telexes}, {telexTotal}, {sightings} and {sightingTotal} are filled in by the game.

    { id: 'E-W1', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'ending:victory' },
      text: '{time}. The Kestrel reaches the beaches off Dunkirk.' },
    { id: 'E-W2', speaker: 'Tom', mode: 'CLICK', trigger: { type: 'event', value: 'ending:victory' },
      text: 'We made it, Skipper. Every false message, every trick, and we still made it.' },
    { id: 'E-W3', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'ending:victory' },
      text: 'Between 26 May and 4 June 1940, around 338,000 soldiers were rescued from Dunkirk, helped by hundreds of civilian “little ships” like yours.' },
    { id: 'E-W4', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'ending:victory' },
      text: 'Score: {telexes} of {telexTotal} telexes judged correctly. {sightings} of {sightingTotal} sightings correct.' },

    { id: 'E-T1', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'ending:outOfTime' },
      text: '18:00. The Kestrel is still at sea.' },
    { id: 'E-T2', speaker: 'Tom', mode: 'CLICK', trigger: { type: 'event', value: 'ending:outOfTime' },
      text: 'We’re too late, Skipper. Too many wrong turns.' },
    { id: 'E-T3', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'ending:outOfTime' },
      text: 'The enemy didn’t need to sink your boat. They only needed to waste your time. Score: {telexes} of {telexTotal} telexes, {sightings} of {sightingTotal} sightings. Try again.' },

    { id: 'E-S1', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'ending:lured' },
      text: 'The French coast rises out of the haze. German guns line the dunes.' },
    { id: 'E-S2', speaker: 'Tom', mode: 'CLICK', trigger: { type: 'event', value: 'ending:lured' },
      text: 'That message sent us straight into their trap. We have to turn back.' },
    { id: 'E-S3', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'ending:lured' },
      text: 'You followed a message you never checked. Score: {telexes} of {telexTotal} telexes, {sightings} of {sightingTotal} sightings. Try again.' },

    { id: 'E-R1', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'ending:turnedBack' },
      text: 'The white cliffs of England appear on the horizon. You’re home, but the beaches at Dunkirk are still full of soldiers.' },
    { id: 'E-R2', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'ending:turnedBack' },
      text: 'A message that rushes you is a message to slow down for. Score: {telexes} of {telexTotal} telexes, {sightings} of {sightingTotal} sightings. Try again.' }
  ]
};
