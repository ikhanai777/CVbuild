# CVBuild

A CV / resume builder with 30 print-ready templates, a writing coach built from
recruiter-side guidance, and export to PDF and Word.

Start from scratch or import a CV you already have — PDF, Word, plain text or
JSON — and the app parses it into structured fields you can edit, restyle and
re-export. Everything runs in the browser: no account, no server, and no CV
data leaves the machine.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 52 tests
npm run build
```

---

## What it does

### Import an existing CV

Drop in a `.pdf`, `.docx`, `.txt`, `.md` or `.json` file, or paste the text.

- **PDF** is read with `pdfjs-dist`, grouping text runs into visual lines by
  their y-position so two-column CVs don't come out interleaved.
- **Word** is read with `mammoth`.
- **JSON** accepts both this app's own export and
  [JSON Resume](https://jsonresume.org) documents.

The parser finds contact details anywhere on the page, splits the rest into
sections by their headings (with a synonym table — "Employment History",
"Career Background" and "Work Experience" are the same section), then splits
each section into dated entries with their bullets. The import screen shows what
it read, which headings it recognised and what it is unsure about, next to a
live preview — parsing a CV is guesswork, and it says so rather than quietly
dropping a job.

Two things make PDF-sourced CVs the hard case, and both are handled explicitly.
A PDF has no list markers — bullets are *drawn*, not written, so they never
reach the text layer — and it has no paragraphs, so one bullet arrives as two or
three hard-wrapped fragments. The parser re-joins lines that cannot be starting
something new, then treats prose following an entry header as a bullet that lost
its marker. Without that, a three-role CV imports as six half-sentences spread
over five jobs.

### 30 templates

Each is a genuinely different layout, not a colour swap. Every template renders
the same content model, so switching never costs you a retype.

| | Template | Layout | ATS-safe |
|---|---|---|---|
| **ATS & classic** | ATS Classic | Single column, system fonts, no graphics | ✅ |
| | Harvard Serif | Centred serif, rule-under-heading | ✅ |
| | Compact One-Page | Tight leading for long careers | ✅ |
| | Broadsheet | Masthead rule, justified serif, drop cap | ✅ |
| **Modern professional** | Modern Professional | Accent rules, generous spacing | ✅ |
| | Executive Brief | Small caps, summary-led | ✅ |
| | Minimal Swiss | Heading rail, hairline rules | ✅ |
| | Engineering Standard | Stack under the summary, projects above education | ✅ |
| | Ivory | Warm paper, serif display over a sans body | ✅ |
| | Muse | Centred and light, headings between hairlines | ✅ |
| | Kyoto | One hairline down the page, very large margins | ✅ |
| | Marina | Every section in a soft rounded panel | ✅ |
| **Two-column** | Two-Column Classic | Tinted left rail | ✖ |
| | Elegant Sidebar | Serif body, tinted right rail | ✖ |
| | Tech Matrix | Dark rail, monospaced labels | ✖ |
| | Portfolio Rail | Portrait left, contact strip, dotted timeline | ✖ |
| | Onyx | Dark rail bled to the page edges, full height | ✖ |
| **Creative** | Creative Band | Full-bleed colour header, optional photo | ✖ |
| | Studio Split | Heavy name block, ruled contacts, right rail | ✖ |
| | Editorial | Wide tracking, hairlines, a great deal of air | ✖ |
| | Couture | Very wide capitals, full-height column rule | ✖ |
| | Aurora | Full-bleed gradient banner, rounded pills | ✖ |
| | Bauhaus | Circle-and-square motif, thick bars, square bullets | ✖ |
| | Atelier | Double-ruled title block over a Garamond body | ✖ |
| | Midnight | The whole page inverted, pale type on near-black | ✖ |
| | Monogram Modern | Initials tile, tinted heading strips | ✖ |
| | Career Timeline | Dated markers down the main column | ✖ |
| **Specialist** | Academic CV | Education and publications first, multi-page | ✅ |
| | Graduate Entry | Education and projects above work history | ✅ |
| | Detailed / Federal | Long-form, full employer detail | ✅ |

**ATS-safe** marks single-column designs with no graphics, tables or text boxes
— the structure applicant tracking systems parse reliably. Use one for online
portals and keep a designed template for applications that go straight to a
person. The app labels this everywhere rather than leaving it to be discovered
after a rejection.

A few templates impose their own section order (the Academic CV drops the
summary and leads with education). That layout is treated as a loan: switch away
and your own order comes back, so a template can never silently hide a section
you wrote.

**Engineering Standard** is ordering, not decoration. A generic CV buries skills
below education; for engineering roles the stack is the first thing both the
keyword filter and the hiring engineer look for, and shipped projects carry more
weight than coursework — so it runs summary → skills → experience → projects →
education. It is the only engineering-oriented template that is ATS-safe (Tech
Matrix is a sidebar design), which matters because engineers mostly apply
through portals.

**Studio Split, Portfolio Rail, Editorial and Couture** are the photo-forward
designs, each built on a different device: ruled contact panels beside a heavy
name block; a portrait over a divided contact strip with a dotted timeline of
roles; wide tracking and hairlines with a lot of air; and very wide capitals
over a full-height column rule. All four render correctly with no photo, which
is how most people will use them. **Ivory** and **Muse** carry the same
aesthetic into single-column layouts that stay portal-safe — Ivory pairs a serif
display face with a sans body on warm paper, Muse centres everything and sets
each heading between two hairlines.

The eight strongest themes each commit to one idea rather than hedging.
**Onyx** bleeds a solid dark rail to the trimmed edge of the sheet and runs it
the full height. **Aurora** puts a gradient banner over rounded pills.
**Bauhaus** sets a circle and a square against the name and marks every heading
with a thick bar. **Broadsheet** is a newspaper — masthead rule, justified
serif, a drop cap opening the summary (styling only, so it stays ATS-safe).
**Kyoto** hangs everything off a single hairline and spends the rest on margin.
**Atelier** frames the name in a double rule like headed stationery.
**Marina** puts each section in a soft rounded panel. **Midnight** inverts the
whole page — excellent as a PDF, expensive to print, and the description says so.

### The writing coach

The Review tab scores the CV out of 100 across seven weighted categories —
contact completeness, summary, impact, brevity, structure, ATS/formatting and
role targeting — and lists every finding with the fix and the exact bullet it
refers to.

It checks what recruiters and ATS vendors consistently check:

- **Quantified bullets.** What share carry a number, percentage, currency or
  magnitude. Target is half or better.
- **Action verbs.** Whether each bullet opens with a strong past-tense verb,
  with a bank of ~110 grouped by the kind of contribution they signal.
- **Weak openers.** "Responsible for", "Helped with", "Duties included" — each
  flagged with the specific rewrite, and one-click verb suggestions biased to
  the sentence's own subject matter.
- **Passive voice**, but only in the opening clause. "Coached 3 PMs; two were
  promoted" is correct usage and isn't flagged.
- **Length.** Estimated page count against what your years of experience
  warrant, plus bullets running past two printed lines.
- **Dates and coverage.** Missing dates and roles with no bullets.
- **Clichés.** "Team player", "results-driven", "proven track record".
- **Keyword targeting.** Paste the job advert and the app extracts its
  meaningful terms and shows which your CV never uses — weighted by how often
  the advert repeats each one.

Coaching is also inline: each bullet shows verb / number / length chips as you
type, because feedback next to the sentence gets acted on and a report at the
end does not.

The **Guide** tab writes out the reasoning behind every rule, with before/after
examples — the six-second scan, the X-Y-Z formula, getting through the filter,
tailoring per application, and what loses applications.

### Export

- **PDF** — printed through the browser's own pipeline, so the text stays
  selectable and searchable. A rasterised PDF is unreadable to every ATS, which
  would undo the rest of the app's work. Choose "Save as PDF" in the dialog.
  When the app is running inside an iframe — where `window.print()` is commonly
  blocked by the frame sandbox — the CV is written into a new top-level window
  and printed from there instead.
- **Word (.docx)** — a real Word document built with the `docx` library:
  styled paragraphs, tab-stopped dates, genuine bullet lists, and two-column
  templates flattened into a borderless table so text keeps reading order.
  Send this when the advert asks for Word.
- **JSON** — re-importable backup of the content without the formatting.

The preview renders at true physical size (A4 or US Letter) with dashed guides
showing where each printed page will break.

### On a phone

The editor and a true-to-size A4 page cannot share a phone screen, so below
900px they become an **Edit / Preview** switch instead of two panes, and the
chrome condenses around it: paired fields go to one column, the tab strip
scrolls rather than wrapping, menus and dialogs are capped to the viewport, the
document name takes its own full-width row, and touch targets grow wherever the
pointer is actually coarse. Verified at 360, 375, 390 and 820px with no
horizontal scrolling at any of them.

### Multiple CVs

Keep one master CV and a tailored copy per application — duplicate, rename and
switch from the toolbar. Everything autosaves to `localStorage`, with
undo/redo (Ctrl+Z / Ctrl+Shift+Z) over the last 60 changes.

---

## How it fits together

```
src/
  types/resume.ts            The document model everything reads and writes
  state/store.ts             Zustand store, localStorage persistence, undo/redo
  templates/
    registry.ts              The 30 template definitions and their defaults
    applyTemplate.ts         Template switching, incl. the section-preset loan
    ResumeDocument.tsx       Layout engines + header variants
    Sections.tsx             Section renderers shared by every template
  styles/
    cv-base.css              Shared CV markup styling, in pt/mm
    templates.css            The 15 themes
    print.css                Promotes the off-screen CV to be the printed page
    app.css                  Editor chrome
  lib/
    import/extractText.ts    PDF / DOCX / text extraction, all client-side
    import/parseResume.ts    Heuristic text → Resume parser
    analysis/language.ts     Verb bank, weak openers, metric and cliché rules
    analysis/keywords.ts     Job-advert term extraction and matching
    analysis/score.ts        The scorecard
    export/docx.ts           Word export
    export/print.ts          PDF via the print pipeline
    export/json.ts           JSON export, import and migration
  data/playbook.ts           The strategy library shown in the Guide tab
  components/                Editor, template gallery, design, review, import
  components/dialogs.tsx     In-app confirm/prompt (see below)
scripts/
  make-artifact-page.mjs     Derives dist/artifact.html for body-only hosts
```

Two details exist because the app has to survive being embedded in a sandboxed
iframe, where the browser silently ignores things a normal page can rely on.
`confirm()`, `prompt()` and `alert()` are no-ops without `allow-modals`, and
`<form>` submission is blocked without `allow-forms` — so deletes and renames go
through `components/dialogs.tsx`, which uses neither. `npm run build` also
rewrites raw control characters and literal U+FFFD in the bundled dependencies
(pdf.js and `string_decoder` carry them) as escape sequences, so the output is
plain text for hosts that reject binary-looking JavaScript.

Every template renders the same markup from `Sections.tsx` and differs only in
CSS and in how the layout engine arranges the blocks. That is what makes 15
templates maintainable, and what guarantees a CV can move between them without
losing anything.

## Tests

```bash
npm test
```

52 tests covering the CV parser (headings, contacts, entry splitting, date
normalisation), the scorecard and language rules, keyword matching, template
switching, Word generation for all 30 templates, and JSON round-tripping.

## Notes and limits

- **Scanned PDFs** have no text layer. The app says so and asks you to paste
  instead, rather than importing an empty CV.
- **Legacy `.doc`** can't be read in the browser — save as `.docx` or PDF first.
- **Photos** are standard in much of continental Europe and expected on some
  CVs in Asia and Latin America; in the UK, US, Canada, Australia and Ireland
  they invite bias screening. The app defaults them off and explains the
  trade-off rather than deciding for you.
- **Keyword matching** is a guide, not a target. Adding a term you can't defend
  survives the filter and then fails the interview.
- Web fonts come from Google Fonts; where that's blocked the templates fall
  back to equivalent system stacks.
