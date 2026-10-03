/* ==================================================================
   Drawings for the rulebook
   ------------------------------------------------------------------
   A chapter shows one with a line of its own:

     @figure insignia | The caption, which can use **bold** and *italic*

   Each drawing below is a name and a piece of SVG. The aircraft are
   the same outlines as the ship's binocular artwork, seen from below,
   nose up, so what the book shows is what the glasses show.
   ================================================================== */

(() => {
  // ---- Markings -------------------------------------------------------------
  const roundel = (x, y, r) =>
    '<g transform="translate(' + x + ' ' + y + ')">' +
      '<circle r="' + r + '" fill="#1f3a78"/>' +
      '<circle r="' + (r * 0.64) + '" fill="#efece2"/>' +
      '<circle r="' + (r * 0.32) + '" fill="#b03a2e"/>' +
    '</g>';

  // The German Balkenkreuz: a black cross with white edges, outlined so it shows on paper
  const cross = (x, y, s) =>
    '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M-6 -15 H6 V-6 H15 V6 H6 V15 H-6 V6 H-15 V-6 H-6 Z" fill="#f2f0ea" stroke="#2e261a" stroke-width="0.8"/>' +
      '<path d="M-2.5 -15 H2.5 V-2.5 H15 V2.5 H2.5 V15 H-2.5 V2.5 H-15 V-2.5 H-2.5 Z" fill="#141414"/>' +
    '</g>';

  // ---- Aircraft, seen from below, nose up ------------------------------------
  const SKIN = 'fill="#a59e8d" stroke="#5b5446" stroke-width="1.5"';
  const DARK = 'fill="#6c6658" stroke="#4a4438" stroke-width="1"';
  const prop = (x, y, rx) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="2.4" fill="rgba(40,40,40,0.35)"/>';
  // One side of the aircraft, drawn again mirrored for the other
  const both = half => half + '<g transform="scale(-1 1)">' + half + '</g>';

  const PLANES = {
    bf109:
      both('<path ' + SKIN + ' d="M10 -30 L106 -17 Q110 -16 110 -12 L110 2 Q110 6 106 6 L10 18 Z"/>' +
           '<path ' + SKIN + ' d="M4 80 L38 82 Q42 83 42 87 L42 95 Q42 98 38 98 L4 100 Z"/>' + cross(80, -6, 1.3)) +
      '<path ' + SKIN + ' d="M0 -98 C6 -98 10 -92 10 -80 L11 -20 C11 10 9 40 6 72 L3 104 C2 108 -2 108 -3 104 L-6 72 C-9 40 -11 10 -11 -20 L-10 -80 C-10 -92 -6 -98 0 -98 Z"/>' +
      prop(0, -104, 32),

    stuka:
      both('<path ' + SKIN + ' d="M12 -38 L62 -37 L130 -27 Q140 -25 140 -14 L139 2 Q138 8 131 8 L62 18 L12 20 Z"/>' +
           '<path ' + SKIN + ' d="M5 84 L46 86 Q54 88 54 95 Q54 104 46 105 L5 106 Z"/>' +
           '<path ' + DARK + ' d="M62 -66 C68 -66 70 -52 69 -40 C68 -30 66 -24 62 -24 C58 -24 56 -30 55 -40 C54 -52 56 -66 62 -66 Z"/>' +
           cross(100, -6, 1.4)) +
      '<path ' + SKIN + ' d="M0 -106 C8 -106 13 -100 14 -90 L15 -40 C15 -10 13 20 9 60 L5 108 C4 114 -4 114 -5 108 L-9 60 C-13 20 -15 -10 -15 -40 L-14 -90 C-13 -100 -8 -106 0 -106 Z"/>' +
      prop(0, -112, 34),

    he111:
      both('<path ' + SKIN + ' d="M12 -34 L52 -36 L122 -24 Q144 -20 144 -9 Q144 2 130 5 L52 17 L12 19 Z"/>' +
           '<path ' + SKIN + ' d="M5 86 L44 88 Q56 90 56 97 Q56 104 44 106 L5 108 Z"/>' +
           '<path ' + DARK + ' d="M48 -72 C54 -72 57 -64 57 -52 L56 22 C56 28 52 30 48 30 C44 30 40 28 40 22 L39 -52 C39 -64 42 -72 48 -72 Z"/>' +
           prop(48, -77, 26) + cross(110, -7, 1.4)) +
      '<path ' + SKIN + ' d="M0 -100 C10 -100 15 -90 15 -76 L15 -20 C15 20 12 50 8 80 L4 112 C3 116 -3 116 -4 112 L-8 80 C-12 50 -15 20 -15 -20 L-15 -76 C-15 -90 -10 -100 0 -100 Z"/>' +
      '<path fill="#d7e2e4" stroke="#5b5446" stroke-width="1" d="M0 -100 C10 -100 15 -90 15 -76 L-15 -76 C-15 -90 -10 -100 0 -100 Z"/>',

    spitfire:
      both('<path ' + SKIN + ' d="M10 -30 C44 -31 84 -26 104 -14 C114 -8 116 0 110 5 C96 12 60 18 10 22 Z"/>' +
           '<path ' + SKIN + ' d="M4 72 C22 70 34 74 36 80 C37 86 30 90 4 90 Z"/>' + roundel(74, -4, 15)) +
      '<path ' + SKIN + ' d="M0 -88 C6 -88 10 -82 11 -72 L11 -20 C11 10 9 40 6 70 L3 92 C2 96 -2 96 -3 92 L-6 70 C-9 40 -11 10 -11 -20 L-11 -72 C-10 -82 -6 -88 0 -88 Z"/>' +
      prop(0, -88, 33),

    hurricane:
      both('<path ' + SKIN + ' d="M10 -32 L94 -24 Q116 -22 116 -9 Q116 4 100 8 L10 24 Z"/>' +
           '<path ' + SKIN + ' d="M4 76 C26 74 38 78 40 86 C41 94 32 98 4 98 Z"/>' + roundel(74, -6, 15)) +
      '<path ' + SKIN + ' d="M0 -86 C8 -86 13 -80 13 -70 L14 -20 C14 12 12 42 8 70 L3 96 C2 100 -2 100 -3 96 L-8 70 C-12 42 -14 12 -14 -20 L-13 -70 C-13 -80 -8 -86 0 -86 Z"/>' +
      '<rect ' + DARK + ' x="-9" y="8" width="18" height="28" rx="5"/>' +
      prop(0, -87, 34)
  };

  // A row of aircraft with their names underneath, always drawn to the same scale
  const row = list => {
    const left = (600 - 200 * list.length) / 2;
    return '<svg viewBox="0 0 600 230" role="img" aria-label="' + list.map(p => p[1]).join(', ') + '">' +
      list.map(([art, name], i) =>
        '<g transform="translate(' + (left + 100 + 200 * i) + ' 100) scale(0.66)">' + PLANES[art] + '</g>' +
        '<text x="' + (left + 100 + 200 * i) + '" y="200" text-anchor="middle" font-size="19">' + name + '</text>'
      ).join('') +
    '</svg>';
  };

  rulebookFigures({
    // Our markings and theirs, side by side
    insignia:
      '<svg viewBox="0 0 600 220" role="img" aria-label="RAF roundel and fin flash; German cross">' +
        roundel(95, 85, 52) +
        '<g transform="translate(185 40)">' +
          '<rect width="22" height="90" fill="#b03a2e"/>' +
          '<rect x="22" width="22" height="90" fill="#efece2" stroke="#2e261a" stroke-width="0.6"/>' +
          '<rect x="44" width="22" height="90" fill="#1f3a78"/>' +
        '</g>' +
        '<text x="145" y="168" text-anchor="middle" font-size="20" font-weight="bold">RAF: ours</text>' +
        '<text x="145" y="194" text-anchor="middle" font-size="16">roundel on the wings, stripes on the tail</text>' +
        '<line x1="300" y1="20" x2="300" y2="200" stroke="#b3a179" stroke-width="1.5"/>' +
        cross(455, 85, 3.4) +
        '<text x="455" y="168" text-anchor="middle" font-size="20" font-weight="bold">Luftwaffe: German</text>' +
        '<text x="455" y="194" text-anchor="middle" font-size="16">black cross, white edges</text>' +
      '</svg>',

    'planes-german': row([['bf109', 'Messerschmitt Bf 109'], ['stuka', 'Junkers Ju 87 “Stuka”'], ['he111', 'Heinkel He 111']]),
    'planes-allied': row([['spitfire', 'Supermarine Spitfire'], ['hurricane', 'Hawker Hurricane']])
  });
})();
