# Rulebook

The book the player keeps by the wheel. Click it on the ship and it opens
over the helm. The brass arrows either side (or the ← → keys, or a swipe)
turn the pages. Esc or **Close the book** puts it away.

Everything the book says is in the files in `pages/`. Edit those.
You shouldn't need to touch the code.

```
index.html      the book
rulebook.css    everything visual
rulebook.js     reads the pages and lays them out
pages/
  contents.js   which chapters are in the book, in order
  00-title.js   the title page
  01-...js      one file per chapter
```

## No web server needed

Each page is a small script, so the book opens straight from disk: just
double-click `index.html` (or `Ship Functionality Demo/shipbuild-demo.html`).
It works the same hosted online.

## The shape of a chapter file

A chapter file is ordinary text wrapped in one line of code at each end:

```
rulebookPage(String.raw`
# Chapter Title

The text of the chapter...
`);
```

Keep the first and last lines exactly as they are and write everything
in between. The text can't contain a backtick (`` ` ``) or `${`, since
those would end the text early. That's why telex blocks use `~~~` rather
than three backticks. If a file breaks, the book prints a "Chapter won't
read" page naming it.

## Adding or reordering chapters

Copy a chapter file in `pages/`, rename it, and add its name to the list
in `pages/contents.js`, in quotes with a comma after it. The order of the
list is the order of the chapters. Lines starting with `//` there are
notes and are skipped.

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
| `~~~` on a line before and after | a telex slip in typewriter type, line breaks kept |
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
