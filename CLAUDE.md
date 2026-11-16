# Ahmed Samak — portfolio site + CV

Personal portfolio ("documentation about Ahmed") live at https://samak97.github.io, plus the LaTeX CV.
This file carries the project context between machines — keep it up to date when decisions change.

## Layout

- `site/` — the Astro app (static output), one page:
  - `src/pages/index.astro` — all the page content (hero, about, experience, education, skills, projects, threads,
    case studies with the GPU playground, game, contact) as plain markup.
  - `src/styles/global.css` — the styles; `src/scripts/site.js` — the dotted hero sky (real moon phase), the
    cursor gravity particles over it (brought back from the old site at Ahmed's request), the GPU
    playground, copy-email buttons, the "Light up the city" game, the bottom dock and reveals.
  - `src/scripts/effects.js` wires in components from React Bits (reactbits.dev), ported to plain JS in
    `src/scripts/rb/` (no React on the site): Glass Surface on the nav, dock and plain buttons, Gooey Nav (the nav
    highlight), Bell Toggle (the "Copy email" buttons, markup in `src/components/CopyEmail.astro`), Fade Content
    (every `.rv` block fades in from a blur; uses gsap), Magic Bento effects on every card and widget, Click Spark,
    Gradual Blur at the bottom of the page, and the Lanyard badge in the footer (three.js, lazy-loaded near the footer).
  - The hero sky in `site.js` also throws an occasional pixel lightning bolt down from the moon.
  - `src/layouts/BaseLayout.astro` — head, SEO meta and JSON-LD, fed by `src/data/profile.ts` and `skills.ts`.
  - Images in `public/`: `me-hero.jpg` (round portrait with the Pixonal logo, shown in black and white by CSS),
    `me-wide.jpg` (footer fallback), `me-avatar.jpg` (thread cards), `x-article.jpg` / `x-maclip.jpg` (X post images,
    self-hosted), `badge-front/back/strap.jpg` (the lanyard's textures, rendered from `scripts/badge.html`).
  - `favicon.svg`: an italic S whose spine is a lightning zigzag, in the blue / red / yellow gradient.
- `cv/` — `ahmed-samak-cv.tex` (source) and `ahmed-samak-cv.txt` (plain-text copy for paste-in forms).
  Layout modelled on a CV Ahmed liked: left-aligned name with italic title, icon contact grid, heavy section rules,
  date over location on the right, Projects with link + Tools line. Compiles on Overleaf (pdfLaTeX) or locally with
  `tectonic ahmed-samak-cv.tex` (XeTeX; the file guards the pdfLaTeX-only lines). Copy the PDF to `cv/My_Resume.pdf`
  and `site/public/ahmed-samak-cv.pdf`; mirror wording changes into the `.txt` and into the Experience section of `site/src/pages/index.astro`.
- `.github/workflows/deploy.yml` — builds `site/` with Bun and deploys to GitHub Pages on push to `main` (Pages is set to "GitHub Actions" mode, not branch mode).
- `Documents/` — **private, never committed** (references' emails, IELTS report with ID details, original photos). Transfer between machines privately, not via this public repo.

## Commands (run inside `site/`)

```bash
bun install
bun run dev       # local dev server
bun run build     # static build into site/dist
bun run preview   # serve the build (add --host to open it from a phone on the same Wi-Fi)
sh scripts/gen-og.sh                 # render scripts/og.html into og.png (link preview); then bump ?v= in BaseLayout
bun scripts/gen-images.ts            # regenerate the app icons from favicon.svg; then bump ?v= on the icon links
sh scripts/gen-badge.sh              # render scripts/badge.html into the lanyard textures (badge-*.jpg)
bun scripts/gen-photo.ts <photo.jpg> # regenerate the cropped portrait (me-320/640.webp, me.jpg)
```

Bun only (Ahmed prefers it; there was no Node on the Windows machine). Scripts already call `bun --bun astro …`.

## Decisions Ahmed made (don't undo without asking)

- Design (Nov 2026, a hybrid of five reference sites he picked): night and day themes (see below), dotted sky in the hero, Instrument
  Serif titles (he rejected Fraunces, Playfair, Bricolage and Syne), accent = blurred blue / red / yellow gradient,
  floating pill nav + bottom quick-links dock, simple and client-facing; not Dubai-themed (Dubai only as a location).
- Section order: hero → About → Experience → Education → Skills → Projects → Threads → Case studies (+ GPU playground)
  → game → contact.
- Hero line under the name is a quote from his X article ("Jack of all trades, master of none…"), not a tagline.
- Threads are big cards with the post images, not plain lines.
- Projects open with a wide Llumen card (work project): a still from Pixonal's LinkedIn video cropped to the map
  only (the side panels show client data), linking to the post and pixonal.com; the video is linked, not rehosted.
  His own projects follow with drawn thumbnails (Frazer EQ, Maclip window, orbit, Pixie page).
- Recommendation section (before Threads): Mohamed Fouad Fakhr's LinkedIn recommendation. The quote is cut off at
  "contributed to the…" because only the truncated text was available; replace with the full text when Ahmed sends it.
- `profile.description` is also the link-preview text: keep it under 160 characters.
- The "1M markers / 100x faster" stat appears only in the case study, the GPU playground and the Pixonal experience entry — not repeated elsewhere.
- Forward Deployed Engineer is mentioned up front (hero intro).
- Client names are written as "UAE government entities" everywhere until Pixonal approves naming them. Don't commit the names.
- Phone numbers appear only in the CV PDF, not on the site.
- CV keeps **both** IELTS (7.5, C1, May 2026) and TOEFL (95, Jan 2020).
- Pixonal titles: **Senior Engineer & Delivery Team Lead** (Dubai, Feb 2026–) with client-facing bullets only (delivery
  team, FDE, deployments); **Senior Software Engineer** (Sheikh Zayed, Jan 2025–Feb 2026) with the engineering bullets
  (graphics + 100x GPU work, dashboards, GeoJSON library). Ahmed leads the **delivery** team; never write that he leads
  or co-leads the engineering team. CV headline: "Senior Software Engineer & Team Lead".
- CV Projects: Frazer, Maclip, Solar System, Pixie, all in the same format (title, date, Tools line, bullets);
  Pixie has no link, so its link icon is left out. Keep all four (Ahmed wants them all).
- CV Education: the degree is its own entry (title/university, dates/location) at the top; certifications follow, Azure AZ-104 last.
- Reveola is left off the site for now.
- Photos: hero = office photo with the PXNL logo, round and black and white; footer and thread avatars = the lakeside photo.
- React Bits components he picked (Nov 2026): Lanyard (footer badge with his photo), Gooey Nav (top nav, kept at
  the old size; links are About, Experience, Education, Projects only), Glass Surface (nav, dock and the plain
  buttons; the gradient CTAs stay gradient), Bell Toggle (Copy email), Fade Content (reveals), Magic Bento effects
  (all cards and widgets), Click Spark, Gradual Blur (page bottom). He tried Laser Flow between About and Llumen
  and dropped it. He also wants the Accordion (React Bits "Accordion Gallery") added later; not placed yet.
- Badge: front bar reads "FORWARD DEPLOYED" / "CODE WIZARD"; the back is only the logo and the site URL.
- Lightning from the moon in the hero: simple and occasional (every 7–16 s), in the sky's own pixel style. Night only.
- Day and night themes (`data-theme="light"` / `"dark"` on `<html>`): picked before first paint in BaseLayout from
  the visitor's saved choice, else their local time (day 6:00–18:00). The nav's sun/moon button and clicking the
  sun or moon in the hero both toggle it, and the choice is remembered. Day is warm parchment and sand (not white),
  with a sun and turning pixel rays in place of the moon. Switching plays a 1.6 s day/night cycle: the orb swings
  down like a clock hand, the other swings up, and the sky, particles and page colours blend along with it.
  By day: four tiny pixel birds that stay, gliding a slow figure-eight above the sun (the counterpart of the night
  lightning; Ahmed found passing flocks too rare), and the cursor
  particles become sunlit dust that loosely swirls after the pointer (inspired by React Bits Swarm Cursor, kept subtle). The GPU playground, the game and the Maclip window stay
  dark screens in both themes. Colours are CSS variables at the top of `global.css`; add new colours there, not inline.
- Only "Llumen" in the hero intro links to the LinkedIn post; "Forward Deployed Engineer" is plain bold text.

## Gotchas

- Astro 7 strips whitespace at line breaks next to inline tags (`<strong>`, `<span>`…). Keep such prose on one line or use `{' '}`.
- Elements whose CSS sets `display` need an explicit `[hidden] { display: none }` (global.css has it).
- The hero sky keeps clear of the text box (`.hero .copy` down to `.ctas`); re-run its layout if the hero text changes size.
- X post text/images come from `https://cdn.syndication.twimg.com/tweet-result?id=<id>&token=a` (oEmbed returns nothing). Save post images into `public/` rather than hot-linking pbs.twimg.com; strip tracking params from post URLs.
- Game links: `https://samak97.github.io/<Repo>/` (his other repos' GitHub Pages) — they coexist with this site on the same domain.
- When previewing in Claude's browser pane, a hidden pane throttles animations and screenshots can be stale; verify with JS measurements.
- `.badge` is already the pill label on the Llumen and thread images; the footer lanyard box is `.hang`. Check a class
  name isn't taken before styling it globally.
- The React Bits ports keep each component's engine as published and swap only the React wrapper for a mount
  function, so a newer upstream version can be diffed against them. Glass Surface keeps only its SVG and
  frosted modes, and Magic Bento only its card effects (not its grid).

## Open to-do

1. Job slideshows: make the MedSoft project clickable → slideshow of product screenshots; maybe every job. Waiting on screenshots (check they're OK to show publicly).
2. Maclip's repo is private, so its CV link 404s for readers: make it public or drop the link.
3. Add Frazer (Rust headset app) as an X post once Ahmed posts it.
4. Accordion (React Bits Accordion Gallery, needs gsap): Ahmed wants it; where it goes is still to decide.
5. Custom domain after friends' feedback: add `site/public/CNAME`, update the site URL in `astro.config.mjs`, `profile.ts`, `robots.txt`, and the OG image text (`scripts/og.html`).

## Working agreement

- Commit/push only with Ahmed's OK; pushes to `main` go live in ~1 minute.
- Before committing, make sure nothing private slips in (client names, phone numbers outside the CV PDF, references' emails, ID details).
