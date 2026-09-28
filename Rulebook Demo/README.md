# Rulebook

The book the player keeps by the wheel. Click it on the ship and it opens
over the helm. The brass arrows either side (or the ← → keys, or a swipe)
turn the pages. Esc or **Close the book** puts it away.

Everything the book says is in plain `.txt` files in `pages/`. Edit those.
You shouldn't need to touch the code.

```
index.html      the book
rulebook.css    everything visual
rulebook.js     reads the pages and lays them out
pages/
  contents.txt  which chapters are in the book, in order
  00-title.txt  the title page
  01-...txt     one file per chapter
```

## It needs a web server

The book reads its `.txt` files with the browser, and browsers won't let a
page opened straight from disk (a `file://` address) read other files. So
open the game through a local server:

- **VS Code:** install the *Live Server* extension, right-click
  `Ship Functionality Demo/shipbuild-demo.html` and choose
  **Open with Live Server**.
- **Or** in the project folder run `python -m http.server`, then visit
  `http://localhost:8000/Ship%20Functionality%20Demo/shipbuild-demo.html`.

Hosted online (GitHub Pages, say) it works as it is. If you do open it
from disk, the book prints this same advice on its first page rather than
showing nothing.

## Adding or reordering chapters

Put a new `.txt` file in `pages/` and add its name to `pages/contents.txt`.
The order of the lines in `contents.txt` is the order of the chapters.
Lines starting with `#` there are notes and are skipped.

Each chapter starts on a new page. A name that doesn't match a file
(watch the capitals: they matter once the game is online) prints a
"Missing chapter" page telling you which one.

## Writing a chapter

Write ordinary text. The book sets it in justified type, splits it across
as many pages as it needs, and never lets it run off a page. Resize the
window and it's laid out again. There's nothing to count.

| You write | You get |
| --- | --- |
| a blank line | a new paragraph |
| `# Title` | the chapter title; also the running head at the top of its right-hand pages |
| `## Heading` | a heading inside the chapter |
| `- item` | a bulleted item |
| `> text` | a boxed note (several `>` lines in a row make one box) |
| `**bold**`, `*italic*` | bold, italic |
| ```` ``` ```` on a line before and after | a telex slip in typewriter type, line breaks kept |
| `===` on its own line | start a new page here |
| `// anything` | a note to yourself; never printed |
| `@title-page` as the first line | lay the file out as a centred title page |

A paragraph can run over several lines in the file. Lines only break where
you leave a blank line. A paragraph that opens with a **bold phrase** is set
as a glossary entry, with no indent.

The title page's `# Title` becomes the running head on left-hand pages.

## What the layout takes care of

- Paragraphs split between pages at a word, never mid-line, and never
  leave just a few words stranded at the top or foot of a page.
- A heading is never left alone at the bottom of a page. It moves over
  with its text.
- The first paragraph of a chapter gets a drop capital. Paragraphs are
  indented only when they follow another paragraph, as in a printed book.
- Very long words and lines wrap rather than spill.
- Page numbers sit in the outside corners, counted from the title page.
  Chapter openings and the title page have no running head.
- All the type is sized as a share of the page's width, so the book has
  the same pages at any window size.
