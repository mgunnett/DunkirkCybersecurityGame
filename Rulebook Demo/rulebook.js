/* ==================================================================
   RULEBOOK — the book
   ------------------------------------------------------------------
   Reads the chapters named in pages/contents.txt, sets them onto
   pages that never overflow, and turns them two at a time.

   To change what the book says, edit the .txt files in pages/.
   You shouldn't need to touch this file. See README.md for the
   formatting rules.
   ================================================================== */

(() => {
  'use strict';

  const PAGES     = 'pages/';
  const CONTENTS  = 'contents.txt';
  const TURN_MS   = 650;     // keep in step with --turn in rulebook.css
  const MIN_WORDS = 5;       // never strand fewer words than this at the top or foot of a page
  const MIN_LINES = 2;       // the same, for ``` telex blocks

  const $ = id => document.getElementById(id);
  const el = {
    book:    $('book'),
    left:    $('left'),
    right:   $('right'),
    leaf:    $('leaf'),
    front:   $('leafFront'),
    back:    $('leafBack'),
    measure: $('measure'),
    prev:    $('prev'),
    next:    $('next'),
    where:   $('where')
  };

  // Opened from the ship, the book lies over the helm; on its own it gets a desk.
  const embedded = window.self !== window.top;
  document.documentElement.classList.toggle('is-embedded', embedded);
  const stillness = window.matchMedia('(prefers-reduced-motion: reduce)');

  let chapters  = [];
  let slots     = [];        // every page side in the book, endpapers included
  let pageCount = 0;         // printed pages, for the plate
  let bookTitle = 'Rulebook';
  let spread    = 0;         // which pair of sides is open
  let turning   = false;

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const make  = (tag, cls) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    return node;
  };
  const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ---- Reading a chapter file ---------------------------------------------
  // Blank line: new paragraph. # heading, ## subheading, - list item,
  // > boxed note, ``` telex block, === page break, // a note to yourself.
  // **bold** and *italic* inside any line.
  function parse(text, file) {
    const chapter = { file, title: '', titlePage: false, blocks: [] };
    let open  = null;          // paragraph, list item or note being gathered
    let fence = null;          // ``` block being gathered
    const flush = () => { if (open) { chapter.blocks.push(open); open = null; } };

    for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
      const line = raw.trimEnd();
      let m;

      if (fence) {
        if (/^```/.test(line)) { chapter.blocks.push(fence); fence = null; }
        else fence.lines.push(line);
        continue;
      }
      if (/^```/.test(line))       { flush(); fence = { type: 'pre', lines: [] }; continue; }
      if (line.trim() === '')      { flush(); continue; }
      if (/^\/\//.test(line))      { continue; }
      if (line === '@title-page')  { chapter.titlePage = true; continue; }
      if (line.trim() === '===')   { flush(); chapter.blocks.push({ type: 'break' }); continue; }

      if ((m = line.match(/^(#{1,2})\s+(.+)$/))) {
        flush();
        const type = m[1].length === 1 ? 'h1' : 'h2';
        chapter.blocks.push({ type, text: m[2] });
        if (type === 'h1' && !chapter.title) chapter.title = m[2].replace(/\*/g, '');
        continue;
      }
      if ((m = line.match(/^[-*]\s+(.+)$/))) { flush(); open = { type: 'li', text: m[1] }; continue; }
      if ((m = line.match(/^>\s?(.*)$/))) {
        if (open && open.type === 'note') open.text += ' ' + m[1];
        else { flush(); open = { type: 'note', text: m[1] }; }
        continue;
      }
      if (open && open.type !== 'note') { open.text += ' ' + line.trim(); continue; }
      flush();
      open = { type: 'p', text: line.trim() };
    }
    flush();
    if (fence) chapter.blocks.push(fence);

    // Book manners: only a paragraph following a paragraph is indented,
    // and a drop capital opens the chapter.
    let prev = null;
    let dropped = chapter.titlePage;
    for (const b of chapter.blocks) {
      b.units = b.type === 'pre' ? b.lines : words(b.text || '');
      if (b.type === 'p') {
        b.entry = /^\*\*/.test(b.text);                 // glossary style: opens in bold
        b.lead  = !prev || prev.type !== 'p';
        if (!dropped && b.lead && !b.entry) { b.drop = true; dropped = true; }
      }
      if (b.type !== 'break') prev = b;
    }
    return chapter;
  }

  // Break text into words, each carrying its own bold/italic, so a paragraph
  // can be cut at any word without breaking the formatting.
  function words(text) {
    const out = [];
    let bold = false, ital = false, word = '', seg = '';
    const close = () => {
      if (!seg) return;
      let html = escape(seg);
      if (ital) html = '<em>' + html + '</em>';
      if (bold) html = '<strong>' + html + '</strong>';
      word += html;
      seg = '';
    };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '*' && text[i + 1] === '*') { close(); bold = !bold; i++; continue; }
      if (c === '*') { close(); ital = !ital; continue; }
      if (/\s/.test(c)) { close(); if (word) out.push(word); word = ''; continue; }
      seg += c;
    }
    close();
    if (word) out.push(word);
    return out;
  }

  // One block, or the part of it from unit `from` up to `to`
  function render(b, from, to) {
    const part = b.units.slice(from, to);
    let node;
    switch (b.type) {
      case 'h1':   node = make('h2', 'bk-h1'); node.innerHTML = part.join(' '); break;
      case 'h2':   node = make('h3', 'bk-h2'); node.innerHTML = part.join(' '); break;
      case 'li':   node = make('p', 'bk-li');  node.innerHTML = part.join(' '); break;
      case 'note': node = make('div', 'bk-note'); node.innerHTML = '<p>' + part.join(' ') + '</p>'; break;
      case 'pre':  node = make('pre', 'bk-pre'); node.textContent = part.join('\n'); break;
      default:
        node = make('p');
        node.innerHTML = part.join(' ');
        if (b.lead)  node.classList.add('lead');
        if (b.entry) node.classList.add('entry');
        if (b.drop && from === 0) node.classList.add('drop');
    }
    if (from > 0) node.classList.add('cont');           // carried over from the page before
    if (to < b.units.length) node.classList.add('runs-on');
    return node;
  }

  // ---- Laying the chapters onto pages --------------------------------------
  function pageEl(p, side) {
    const node = make('div', 'page page--' + side + ' page--' + p.kind);
    node.innerHTML = '<div class="page__head"></div><div class="page__body"></div><div class="page__folio"></div>';
    node.children[0].textContent = p.head || '';
    node.children[1].innerHTML = p.items ? p.items.join('') : '';
    node.children[2].textContent = p.folio || '';
    return node;
  }

  function paginate() {
    const pages = [];

    for (const ch of chapters) {
      const kind = ch.titlePage ? 'title' : 'text';
      const shell = pageEl({ kind }, 'right');
      el.measure.replaceChildren(shell);
      const body = shell.children[1];
      const fits = () => body.scrollHeight <= body.clientHeight + 1;

      let page = { chapter: ch, kind, items: [], types: [] };
      const place = (node, type) => {
        body.appendChild(node);
        page.items.push(node.outerHTML);
        page.types.push(type);
      };
      const turnOver = () => {
        // A heading is never left alone at the foot of a page: take it along.
        let carry = null;
        const last = page.types.length - 1;
        if (last > 0 && /^h/.test(page.types[last])) {
          carry = { html: page.items.pop(), type: page.types.pop() };
        }
        pages.push(page);
        page = { chapter: ch, kind, items: [], types: [] };
        body.replaceChildren();
        if (carry) {
          body.insertAdjacentHTML('beforeend', carry.html);
          page.items.push(carry.html);
          page.types.push(carry.type);
        }
      };

      for (const b of ch.blocks) {
        if (b.type === 'break') { if (page.items.length) turnOver(); continue; }

        const total = b.units.length;
        const floor = b.type === 'pre' ? MIN_LINES : MIN_WORDS;
        const splittable = !/^h/.test(b.type) && total > 1;
        let from = 0;

        while (from < total) {
          const rest = render(b, from, total);
          body.appendChild(rest);
          const whole = fits();
          body.removeChild(rest);
          if (whole) { place(rest, b.type); break; }

          // Find how much of it will fit, a word (or line) at a time.
          let fit = 0;
          if (splittable) {
            let lo = 0, hi = total - from - 1;
            while (lo < hi) {
              const mid = (lo + hi + 1) >> 1;
              const trial = render(b, from, from + mid);
              body.appendChild(trial);
              const ok = fits();
              body.removeChild(trial);
              if (ok) lo = mid; else hi = mid - 1;
            }
            fit = lo;
          }

          let take = fit;
          const over = total - from - take;
          if (over < floor) take -= floor - over;        // don't strand a few words overleaf
          if (take < floor) take = 0;                    // nor a few at the foot of this page

          if (take === 0 && page.items.length === 0) {
            // Doesn't fit even on a fresh page: set what will go and carry on.
            take = splittable ? Math.max(fit, 1) : total - from;
          }
          if (take > 0) place(render(b, from, from + take), b.type);
          from += take;
          if (from < total) turnOver();
        }
      }
      if (page.items.length) pages.push(page);
    }

    el.measure.replaceChildren();
    return pages;
  }

  function build() {
    const pages = paginate();
    pageCount = pages.length;

    // Side 0 is the inside of the front cover, so page 1 falls on the right.
    slots = [{ kind: 'endpaper' }];
    pages.forEach((p, i) => {
      const num = i + 1;
      const side = num % 2 ? 'right' : 'left';
      const opens = i === 0 || pages[i - 1].chapter !== p.chapter;
      slots.push({
        kind:  p.kind,
        items: p.items,
        head:  p.kind === 'title' || opens ? '' : side === 'left' ? bookTitle : p.chapter.title,
        folio: p.kind === 'title' ? '' : String(num)
      });
    });
    if (slots.length % 2) slots.push({ kind: 'endpaper' });
    spread = clamp(spread, 0, lastSpread());
  }

  // ---- Showing and turning -------------------------------------------------
  const lastSpread = () => slots.length / 2 - 1;
  const slotEl = i => pageEl(slots[i], i % 2 ? 'right' : 'left');

  function show() {
    el.left.replaceChildren(slotEl(2 * spread));
    el.right.replaceChildren(slotEl(2 * spread + 1));
    el.prev.disabled = spread === 0;
    el.next.disabled = spread >= lastSpread();
    el.where.textContent = describe();
  }

  function describe() {
    const nums = [2 * spread, 2 * spread + 1].filter(n => n >= 1 && n <= pageCount);
    if (nums.length === 2) return 'Pages ' + nums[0] + '–' + nums[1] + ' of ' + pageCount;
    if (nums.length === 1) return 'Page ' + nums[0] + ' of ' + pageCount;
    return spread === 0 ? 'Front cover' : 'Back cover';
  }

  function turn(dir) {
    const to = spread + dir;
    if (turning || to < 0 || to > lastSpread()) return;
    if (stillness.matches) { spread = to; show(); return; }

    turning = true;
    const fwd = dir > 0;
    // The leaf: its face is the page lifting, its back the page landing.
    el.front.replaceChildren(slotEl(fwd ? 2 * spread + 1 : 2 * spread));
    el.back.replaceChildren(slotEl(fwd ? 2 * to : 2 * to + 1));
    // Underneath it, the page beyond is uncovered.
    if (fwd) el.right.replaceChildren(slotEl(2 * to + 1));
    else     el.left.replaceChildren(slotEl(2 * to));

    el.leaf.className = 'leaf ' + (fwd ? 'leaf--fwd' : 'leaf--back');
    void el.leaf.offsetWidth;                          // start from flat
    el.leaf.classList.add('is-turning');
    el.prev.disabled = el.next.disabled = true;
    spread = to;

    setTimeout(() => {
      show();
      el.leaf.className = 'leaf';
      turning = false;
    }, TURN_MS);
  }

  el.prev.addEventListener('click', () => turn(-1));
  el.next.addEventListener('click', () => turn(1));

  window.addEventListener('keydown', ev => {
    if (ev.key === 'ArrowRight' || ev.key === 'PageDown') { turn(1); ev.preventDefault(); }
    else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { turn(-1); ev.preventDefault(); }
    else if (ev.key === 'Home') { spread = 0; show(); }
    else if (ev.key === 'End') { spread = lastSpread(); show(); }
    else if (ev.key === 'Escape' && embedded) window.parent.postMessage({ rulebook: 'close' }, '*');
  });

  // A swipe across the book turns it too
  let swipeX = null;
  el.book.addEventListener('pointerdown', ev => { swipeX = ev.clientX; });
  el.book.addEventListener('pointerup', ev => {
    if (swipeX === null) return;
    const dx = ev.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 50) turn(dx < 0 ? 1 : -1);
  });

  // Page sizes follow the window; set the text again when it changes.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!chapters.length || turning) return;
      build();
      show();
    }, 150);
  });

  // ---- Loading the pages ---------------------------------------------------
  async function getText(name) {
    const res = await fetch(PAGES + name, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.text();
  }

  // Problems are printed in the book itself, where you'll see them.
  const cannotOpen = err => location.protocol === 'file:' ? `
# The pages won't open

This book reads its pages from the text files in the **pages** folder, and browsers don't let a page opened straight from your disk read other files.

Open the game through a local web server instead:

- In VS Code, install the **Live Server** extension, right-click the HTML file and choose **Open with Live Server**.
- Or run **python -m http.server** in the project folder and visit **localhost:8000**.

Once the game is hosted online this goes away by itself.
` : `
# The pages won't open

The list of chapters, **pages/${CONTENTS}**, couldn't be read (${err.message}). Check the file is there and the name matches exactly.
`;

  const missing = name => `
# Missing chapter

The contents list names **pages/${name}**, but that file couldn't be read. Check it exists and that the name in **${CONTENTS}** matches exactly, capitals included.
`;

  async function load() {
    let list;
    try {
      list = await getText(CONTENTS);
    } catch (err) {
      chapters = [parse(cannotOpen(err), CONTENTS)];
      return finish();
    }

    const files = list.split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#'));
    chapters = await Promise.all(files.map(name =>
      getText(name).then(t => parse(t, name)).catch(() => parse(missing(name), name))
    ));

    const cover = chapters.find(c => c.titlePage && c.title);
    if (cover) bookTitle = cover.title;
    finish();
  }

  async function finish() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    build();
    show();
  }

  load();
})();
