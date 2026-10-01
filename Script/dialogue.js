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
    length:   600,       // real seconds until 15:00, when it's too late
    date:     '30 MAY 40',

    // How close to the ordered course counts as "on course", in degrees either side
    tolerance: 20,

    // Seconds on course needed to reach the beaches. Only counts while the boat
    // is on the course of the latest true order; it can only finish on the last leg.
    routeSeconds: 460,

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
    newCourseGrace: 20,
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
  //   BN-nn:correct, BN-nn:wrong, BN-nn:missed             (aircraft)
  //   remind:unread, remind:offCourse, remind:offCourseUrgent
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
    { id: 'I-14', speaker: 'Graves', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'This is Able Seaman Lacey. He’s going with you.' },
    { id: 'I-15', speaker: 'Tom', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'Tom, sir. Er, Skipper. I’ve never been past the harbour wall, if I’m honest.' },
    { id: 'I-16', speaker: 'Graves', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'You have ten hours to reach the beaches. Any later and there may be no one left to bring home. Good luck.' },
    { id: 'I-17', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      text: 'Steer with the WHEEL and watch your course on the COMPASS. Look about with the BINOCULARS. Read your orders on the TELEX, and check each one against the RULEBOOK.' },
    { id: 'I-18', speaker: 'Narrator', mode: 'CLICK', trigger: { type: 'event', value: 'intro' },
      onDone: 'startVoyage',
      text: '05:00. The Kestrel leaves Ramsgate.' },

    // ==== Act 1: Leaving England (true course 072) ==============================

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
---
Test of line. This machine will carry your orders for the
crossing. Check every signal against your handbook before you
act on it.
` },
    { id: 'V-03', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-00:arrived' },
      text: 'There it goes! Something’s coming through.' },
    { id: 'V-04', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-00:read' },
      text: 'Just Dover testing the line. Not much to it… though I suppose it’s worth remembering what a real one looks like.' },

    { id: 'TX-01', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+0:35' },
      correctAction: 'trust', newHeading: 72,
      concept: 'A true message passes every check.',
      text: `
SERIAL:   NR 036
PRIORITY: IMMEDIATE
TIME:     0530Z/30 MAY 40
---
Kestrel to proceed by Route X. Steer 072 degrees to pass the
North Goodwin light vessel. Keep wireless silence throughout.
` },
    { id: 'V-05', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-01:read' },
      text: 'Our first real orders. Your call, Skipper.' },
    { id: 'V-05b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'TX-01:trust' },
      text: 'And we’re off. France, here we come.' },

    { id: 'V-06', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'time', value: 'T+1:10' },
      text: 'Look at all the boats, Skipper. Fishing boats, yachts, even a paddle steamer from the Thames.' },

    { id: 'TX-02', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+1:50' },
      correctAction: 'reject', lureHeading: 180, lure: 'lured',
      fails: ['1. Who sent it?', '5. Does the order make sense?'],
      concept: 'Spoofing: a lookalike sender, like a fake email address one letter off.',
      text: `
SERIAL:   NR 039
PRIORITY: IMMEDIATE
TIME:     0645Z/30 MAY 40
FROM:     V.A. DOVRE (DYNAMO)
---
Route X closed by mines. Alter course to 180 degrees for
Calais Roads, where an escort will meet you.
` },
    { id: 'V-07', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-02:read' },
      text: 'Mines on our route? And an escort waiting for us. That’s good of them… isn’t it?' },
    { id: 'V-08', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'TX-02:reject' },
      text: 'We’re not turning? …Oh. DOVRE. I read straight past that.' },
    { id: 'V-09', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'TX-02:trust' },
      text: 'Calais, then. If you’re sure, Skipper.' },

    { id: 'V-10', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'time', value: 'T+2:30' },
      text: 'Skipper, how do we know we’re really where Dover thinks we are?' },
    { id: 'V-11', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'time', value: 'T+2:36' },
      text: 'Out here every bit of sea looks the same as the last.' },

    { id: 'BN-01', speaker: 'Binoculars', mode: 'SPOT', trigger: { type: 'time', value: 'T+2:40' },
      until: 'T+3:10',
      sighting: { kind: 'mark', art: 'lightvessel', ahead: 1100, offset: 2, w: 34, h: 14 },
      text: 'The North Goodwin light vessel, red, with N. GOODWIN on her side. Only there if you’re on course.' },
    { id: 'V-12', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'BN-01:spotted' },
      text: 'North Goodwin! So that’s where we are.' },
    { id: 'V-13', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-01:missedOffCourse' },
      text: 'Nothing out there but open water.' },
    { id: 'V-13b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-01:missed' },
      text: 'Was there something back there? I couldn’t say.' },

    // ==== Act 2: Open water (true course 015) ===================================

    { id: 'TX-03', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+3:15' },
      correctAction: 'trust', newHeading: 15,
      concept: 'A true change of orders says plainly why.',
      text: `
SERIAL:   NR 041
PRIORITY: MOST IMMEDIATE
TIME:     0810Z/30 MAY 40
---
Enemy batteries at Gravelines now ranging on Route X. Alter
course to 015 degrees for the Kwinte Buoy. Keep the swept
water. Mines both sides.
` },
    { id: 'V-14', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-03:read' },
      text: 'Another change of course. That’s two today.' },
    { id: 'V-14b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'TX-03:trust' },
      text: 'Steady as she goes.' },

    { id: 'TX-04', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+4:00' },
      correctAction: 'reject', lureHeading: 270, lure: 'turnedBack',
      fails: ['1. Who sent it?', '2. Is it for us?', '3. Does the number fit?', '4. Does the time fit?', '5. Does the order make sense?'],
      concept: 'Phishing and social engineering: urgency, a big name, and “no time to check”.',
      text: `
PRIORITY: URGENT
TIME:     9 O'CLOCK
FROM:     FIRST LORD OF THE ADMIRALTY
TO:       ALL SMALL CRAFT
SIGN:     OBEY AT ONCE.
---
Urgent urgent. Mines ahead on every route. Turn back to
Ramsgate immediately. Report your position by wireless at
once. No time to check this signal.
` },
    { id: 'V-15', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-04:read' },
      text: 'The First Lord of the Admiralty! That’s the top of the whole Navy. We have to turn back… don’t we?' },
    { id: 'V-16', speaker: 'Tom', mode: 'AUTO', duration: 7, trigger: { type: 'event', value: 'TX-04:reject' },
      text: 'You’re ignoring the First Lord? …I hope you know what you’re doing, Skipper.' },
    { id: 'V-17', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-04:trust' },
      text: 'Skipper, we’re heading home. The men on the beach are still waiting for us…' },

    { id: 'V-18', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'time', value: 'T+4:45' },
      text: 'Hear that? Engines. Aircraft!' },
    { id: 'V-19', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'time', value: 'T+4:48' },
      text: 'Ours or theirs? Remember your WEFT.' },

    { id: 'BN-02', speaker: 'Binoculars', mode: 'SPOT', trigger: { type: 'time', value: 'T+4:50' },
      sighting: { kind: 'aircraft', aircraft: 'spitfire' },
      text: 'A Spitfire crosses ahead. Rounded wings, one engine, red, white and blue roundels. Click it and choose German or Allied.' },
    { id: 'V-20', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-02:correct' },
      text: 'One of ours! The RAF is watching over the beaches.' },
    { id: 'V-21', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'BN-02:wrong' },
      text: 'German? Are you sure? That’s not what I saw.' },
    { id: 'V-21b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-02:missed' },
      text: 'It’s gone. We never got a proper look at it.' },

    { id: 'TX-05', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+5:15' },
      correctAction: 'trust',
      concept: 'Security warnings: a true signal can tell you to stay alert, without changing your orders.',
      text: `
SERIAL:   NR 043
PRIORITY: IMMEDIATE
TIME:     1010Z/30 MAY 40
---
Warning. Enemy is sending false signals in our name to small
craft on all routes. Check every signal against your handbook.
No change to your orders.
` },
    { id: 'V-22', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-05:read' },
      text: 'So that’s what’s been going on.' },

    { id: 'TX-06', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+6:00' },
      correctAction: 'reject', lureHeading: 72, lure: 'lured',
      fails: ['3. Does the number fit?', '4. Does the time fit?'],
      concept: 'Replay attack: an old, real message recorded and sent again.',
      text: `
SERIAL:   NR 036
PRIORITY: IMMEDIATE
TIME:     0530Z/30 MAY 40
---
Kestrel to proceed by Route X. Steer 072 degrees to pass the
North Goodwin light vessel. Keep wireless silence throughout.
` },
    { id: 'V-23', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'event', value: 'TX-06:read' },
      text: 'Route X again! Maybe the guns have moved off. It’d be a lot quicker.' },
    { id: 'V-24', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'TX-06:reject' },
      text: 'Not taking the short cut? Hm. Something about it did feel familiar.' },
    { id: 'V-25', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'TX-06:trust' },
      text: 'Funny. I could swear we’ve done this bit before.' },

    { id: 'BN-03', speaker: 'Binoculars', mode: 'SPOT', trigger: { type: 'time', value: 'T+6:20' },
      until: 'T+6:45',
      sighting: { kind: 'mark', art: 'kwinte', ahead: 800, offset: -2, w: 5, h: 10 },
      text: 'The Kwinte Buoy, green and white, marked KWINTE. Only there if you’re on course.' },
    { id: 'V-26', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-03:spotted' },
      text: 'KWINTE, it says. That’s the one.' },
    { id: 'V-26b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-03:missedOffCourse' },
      text: 'No buoy anywhere. Are we where we ought to be?' },
    { id: 'V-26c', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-03:missed' },
      text: 'We’ve gone past the Kwinte Buoy without a look at it.' },

    // ==== Act 3: The beaches (true course 040) ==================================

    { id: 'TX-07', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+6:50' },
      correctAction: 'trust', newHeading: 40,
      concept: 'A true message passes every check.',
      text: `
SERIAL:   NR 045
PRIORITY: MOST IMMEDIATE
TIME:     1145Z/30 MAY 40
---
Kestrel to turn for the beaches. Steer 040 degrees for
Dunkirk. Small craft are to work the beaches between
Malo-les-Bains and Bray-Dunes.
` },
    { id: 'V-27', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-07:read' },
      text: 'Dunkirk! Is this it, Skipper?' },
    { id: 'V-28', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'TX-07:trust' },
      text: 'Not far now.' },

    { id: 'TX-08', speaker: 'Telex', mode: 'TELEX', trigger: { type: 'time', value: 'T+7:05' },
      correctAction: 'reject', lureHeading: 140, lure: 'lured',
      fails: ['3. Does the number fit?', '5. Does the order make sense?'],
      concept: 'Tampering: a true message changed on its way to you (a man-in-the-middle).',
      text: `
SERIAL:   NR 045
PRIORITY: MOST IMMEDIATE
TIME:     1145Z/30 MAY 40
---
Kestrel to turn for the beaches. Steer 140 degrees for
Dunkirk. Small craft are to work the beaches between
Malo-les-Bains and Bray-Dunes.
` },
    { id: 'V-29', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 7, trigger: { type: 'event', value: 'TX-08:read' },
      text: 'Another one already? Dover’s busy today.' },
    { id: 'V-30', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'TX-08:reject' },
      text: 'Holding course? Fair enough. You’ve not been wrong yet.' },
    { id: 'V-31', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'TX-08:trust' },
      text: 'That’s a sharp turn, Skipper. Are the beaches really that way?' },

    { id: 'V-32', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'time', value: 'T+7:40' },
      text: 'Skipper… look at the horizon. All that black smoke. Is that Dunkirk?' },

    { id: 'BN-04', speaker: 'Binoculars', mode: 'SPOT', trigger: { type: 'time', value: 'T+8:00' },
      sighting: { kind: 'aircraft', aircraft: 'stuka' },
      text: 'A Stuka crosses ahead. Bent wings, wheels fixed down, black crosses. Click it and choose German or Allied.' },
    { id: 'V-33', speaker: 'Tom', mode: 'AUTO', duration: 5, trigger: { type: 'event', value: 'BN-04:correct' },
      text: 'One of theirs. Keep her steady, Skipper. We’re nearly there.' },
    { id: 'V-34', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'BN-04:wrong' },
      text: 'One of ours? Then why is it diving at the boats?' },
    { id: 'V-34b', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'BN-04:missed' },
      text: 'It’s gone over. I never saw whose it was.' },

    { id: 'V-35', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 6, trigger: { type: 'time', value: 'T+8:45' },
      text: 'I can see them. Lines of men, all the way down the beach, standing in the water. Waiting.' },
    { id: 'V-36', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'time', value: 'T+9:20' },
      text: 'Bring her in slow, Skipper. Mind the shallows.' },

    // ==== Reminders (any time) ==================================================

    { id: 'R-01', speaker: 'Tom', mode: 'AUTO', duration: 3, trigger: { type: 'event', value: 'remind:unread' },
      text: 'There’s a message waiting on the telex, Skipper.' },
    { id: 'R-02', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'event', value: 'remind:offCourse' },
      text: 'The compass doesn’t match our orders, Skipper.' },
    { id: 'R-03', speaker: 'Tom', mode: 'AUTO_CLICK', duration: 5, trigger: { type: 'event', value: 'remind:offCourseUrgent' },
      text: 'We’re drifting badly. If we don’t correct now, we’ll never make it.' },
    { id: 'R-04', speaker: 'Tom', mode: 'AUTO', duration: 4, trigger: { type: 'time', value: 'T+8:00' },
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
      text: '15:00. The Kestrel is still at sea.' },
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
