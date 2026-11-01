# Ahmed Samak — portfolio site + CV

Personal portfolio ("documentation about Ahmed") live at https://samak97.github.io, plus the LaTeX CV.
This file carries the project context between machines — keep it up to date when decisions change.

## Layout

- `site/` — the Astro app (static output). Content lives in `site/src/data/*.ts`; sections in `site/src/components/`.
  - `profile.ts` (name, roles, hero badges, stats), `experience.ts` (changelog), `skills.ts` (modules),
    `showcase.ts` (case studies, games, certifications, X posts), `nav.ts` (sidebar order).
- `cv/` — `ahmed-samak-cv.tex` (Overleaf source, ATS-optimised) and `ahmed-samak-cv.txt` (plain-text copy for paste-in forms).
  Overleaf is the master for the PDF; mirror wording changes into the `.txt` and into the site data.
- `.github/workflows/deploy.yml` — builds `site/` with Bun and deploys to GitHub Pages on push to `main` (Pages is set to "GitHub Actions" mode, not branch mode).
- `Documents/` — **private, never committed** (references' emails, IELTS report with ID details, original photos). Transfer between machines privately, not via this public repo.

## Commands (run inside `site/`)

```bash
bun install
bun run dev       # local dev server
bun run build     # static build into site/dist
bun run preview   # serve the build (add --host to open it from a phone on the same Wi-Fi)
bun scripts/gen-images.ts            # regenerate og.png + app icons
bun scripts/gen-photo.ts <photo.jpg> # regenerate the cropped portrait (me-320/640.webp, me.jpg)
```

Bun only (Ahmed prefers it; there was no Node on the Windows machine). Scripts already call `bun --bun astro …`.

## Decisions Ahmed made (don't undo without asking)

- Site always opens in **dark mode**; the theme toggle is per-visit only (not persisted).
- Hero: title already says "Team Lead", so there is no Team Lead badge. Badges stay an **even count** (3x2 / 2x3 grid; swipe row on phones). Full-Stack badge goes last.
- The "1M markers / 100x faster" stat appears only in the case study, the GPU playground and the Pixonal changelog entry — not repeated elsewhere.
- Forward Deployed Engineer is mentioned up front (hero badges + terminal).
- Client names are written as "UAE government entities" everywhere until Pixonal approves naming them. Don't commit the names.
- Phone numbers appear only in the CV PDF, not on the site.
- CV keeps **both** IELTS (7.5, C1, May 2026) and TOEFL (95, Jan 2020).
- Reveola game card is commented out in `showcase.ts` for now.
- Sidebar order: Introduction (README, Getting Started) → Reference (Modules, Changelog, Case Studies, Threads, Certifications, GPU Playground) → Extras (Arcade, Contact).
- Photo: the outdoor portrait, shown in Getting Started and as the Contact/Threads avatar.

## Gotchas

- Astro 7 strips whitespace at line breaks next to inline tags (`<strong>`, `<span>`…). Keep such prose on one line or use `{' '}`.
- HTML injected with `set:html` doesn't get Astro's scoped-style attribute — style it with `:global()`.
- Elements whose CSS sets `display` need an explicit `[hidden] { display: none }`.
- Lenis (smooth scroll) also applies the CSS `scroll-padding-top`; `scrollToTarget` in `motion.ts` compensates. In-page jumps land on each section's heading 40px from the top.
- The hero background (`.hero-bg`) is full-bleed (viewport width minus sidebar); the gravity effect listens on `window` so it works to the screen edges.
- X post text/images come from `https://cdn.syndication.twimg.com/tweet-result?id=<id>&token=a` (oEmbed returns nothing). Images are hot-linked from pbs.twimg.com; strip tracking params from post URLs.
- Game links: `https://samak97.github.io/<Repo>/` (his other repos' GitHub Pages) — they coexist with this site on the same domain.
- When previewing in Claude's browser pane, a hidden pane throttles animations and screenshots can be stale; verify with JS measurements.

## Open to-do

1. Job slideshows: make the MedSoft project clickable → slideshow of product screenshots; maybe every job. Waiting on screenshots (check they're OK to show publicly).
2. Recompile the CV on Overleaf (IELTS + TOEFL) and copy the PDF to `site/public/ahmed-samak-cv.pdf`.
3. Add Frazer (Rust headset app) as an X post once Ahmed posts it.
4. Custom domain after friends' feedback: add `site/public/CNAME`, update the site URL in `astro.config.mjs`, `profile.ts`, `robots.txt`, and the OG image text (`scripts/gen-images.ts`).

## Working agreement

- Commit/push only with Ahmed's OK; pushes to `main` go live in ~1 minute.
- Before committing, make sure nothing private slips in (client names, phone numbers outside the CV PDF, references' emails, ID details).
