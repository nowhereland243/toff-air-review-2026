# SPEC — ToFF Residency Application Review Site

**Project:** Tom of Finland Foundation — Artist-in-Residence Application Review Site
**Cohort:** 2026 (architecture must support future cohorts with config-only changes)
**Owner:** Nolan Feng, Board Secretary
**Executor:** Claude Code (Sonnet 4.6 for Phases 1–2; see §12)
**Status of this document:** Authoritative. Where this spec is explicit, follow it exactly. Where it is silent, make the smallest reasonable choice and note it in `DECISIONS.md`.

---

## 1. Purpose & Product Summary

A private, password-protected, static website where residency judges and internal ToFF members review artist applications: browse all applicants visually, read proposals and bios, view work-sample images and CV PDFs, compare artists side by side, and submit blind scores via pre-filled Google Forms. Data originates in a Notion database; the site is a privacy-filtered static snapshot regenerated on demand.

**Non-goals:** no user accounts, no server-side database, no in-site score storage, no editing of application data, no public access.

---

## 2. Architecture

Three cleanly separated layers so future cohorts require config changes only:

```
[Notion DB] → fetch script (Node) → /data/applicants.json + /public/assets/**
                                          ↓
                              Static site (Next.js static export or Astro)
                                          ↓
                      Vercel (free tier) + edge-middleware shared-password gate
                                          ↓
              Scoring: per-artist pre-filled Google Form links → private Sheet
```

- **Repo:** single GitHub repository connected to Vercel for auto-deploy on push.
- **Framework:** Astro or Next.js (static export mode). Choose whichever produces the cleanest static output with an islands/lightbox pattern; record the choice in `DECISIONS.md`. No CMS, no runtime API calls to Notion.
- **Cohort paths:** the 2026 site lives at `/2026/`. Root `/` redirects to the current cohort (set in config). Future cohorts deploy alongside at `/2027/` etc., forming a permanent institutional archive.

### Repo structure

```
/config/2026.json          ← all cohort-specific values
/scripts/fetch.mjs         ← Notion → JSON + asset download + privacy filter
/scripts/lib/normalize.mjs ← Time-and-Room normalization (see §6)
/data/2026/applicants.json ← generated, judge-safe (committed)
/public/assets/2026/**     ← downloaded images (web + original) and PDFs (committed or Git LFS if large)
/src/**                    ← site source
/SPEC.md                   ← this document
/CLAUDE.md                 ← 10-line pointer: read SPEC.md; current phase; commands
/RUNBOOK.md                ← Appendix A rendered as standalone doc
/JUDGES.md                 ← Appendix C source (also rendered as site page)
/DECISIONS.md              ← running log of choices made where spec was silent
```

---

## 3. Config Schema (`/config/2026.json`)

Everything cohort-specific lives here. **Nothing cohort-specific may be hardcoded in `/src` or `/scripts`.**

```jsonc
{
  "cohort": "2026",
  "cohortTitle": "Artist-in-Residence Applications — 2026",
  "notionDatabaseId": "2b7305fa12a580f4a9fce98d8a07663a",
  "notionDataSourceId": "2b7305fa-12a5-8011-be6d-000bda99bdb3",
  "sitePassword_env": "SITE_PASSWORD",        // actual value in Vercel env var, never in repo
  "scoreFormPrefillTemplate": "https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.ARTIST_FIELD_ID={{artistName}}&entry.JUDGE_FIELD_ID={{judgeName}}",
  "scoringDeadline": "2026-08-15",
  "fields": {
    "title": "Last Name",
    "visible": [
      "First Name", "Last Name", "City", "Country",
      "What is your medium?", "Artist biography", " Proposal",
      "Artwork Descriptions", "Plans for Archive", "Writing Samples",
      "Work Samples", "Resume/CV", "Time and Room", "Past Residency ",
      "Anything Else", "Website", "Social URL", "Other Links",
      "Video/Audio Work Urls", "LA"
    ],
    "hidden": [
      "Email", "Phone", "Street", "House/apt#", "Zipcode", "State",
      "Referrer", "How did you hear about us?", "Special Requirements"
    ]
  },
  "imageMaxWidth": 1600
}
```

Notes:
- Property names above match the 2026 Notion schema exactly, including the leading space in `" Proposal"` and trailing space in `"Past Residency "`. The fetch script maps them to clean camelCase keys in `applicants.json` (e.g., `proposal`, `pastResidency`) via a mapping table derived from this config, so schema drift next year = config edit only.
- `Special Requirements` is **staff-only** (may contain health/accessibility information) and is hidden from the judge site. `Anything Else` is visible (typically a message addressed to reviewers).
- External links (`Website`, `Social URL`, `Other Links`, `Video/Audio Work Urls`) are visible and open in new tabs.

---

## 4. Fetch Script (`scripts/fetch.mjs`)

**Run:** `node scripts/fetch.mjs --cohort 2026` with `NOTION_TOKEN` in `.env` (never committed; `.env` in `.gitignore`).

Requirements:

1. **Query** the Notion database via the official API (`@notionhq/client`), paginating (100/page) until complete. Respect rate limits (~3 req/s; add modest backoff).
2. **Download all files immediately.** Notion file URLs are signed AWS links that **expire after ~1 hour** — download in the same run, never store the signed URLs. For each applicant:
   - `Work Samples` → save originals to `/public/assets/2026/{slug}/work/original/`, and generate web versions (max width from config, quality ~82, via `sharp`) to `/public/assets/2026/{slug}/work/web/`. Preserve original aspect ratios. Convert TIFF/HEIC to JPEG for web versions.
   - `Resume/CV` → save PDF(s) to `/public/assets/2026/{slug}/cv/`.
   - `{slug}` = `lastname-firstname` lowercased, ASCII-transliterated, de-duplicated with numeric suffix if needed.
3. **Privacy filter — HARD REQUIREMENT.** Fields listed in `fields.hidden` must **never be written** to `applicants.json` or any file under `/public` or `/data`. In a static site, anything in the shipped JSON is readable by every visitor via dev tools; filtering must happen at export time, in this script. Add an automated check: after generation, grep the output for `@` in email-like patterns and for the string values of hidden fields of the first record; fail the build if found.
4. **Normalize** `Time and Room` per §6.
5. **Output** `/data/2026/applicants.json`: array of applicants with clean keys, relative asset paths, normalized room data, and a generated `scoreUrl` (the pre-fill template with `{{artistName}}` filled; `{{judgeName}}` left as a client-side substitution token).
6. **Idempotent & incremental:** safe to re-run; skip downloading files that already exist with matching size; `--force` flag to re-download all.
7. **Summary report** printed at end: applicant count, images downloaded, PDFs downloaded, applicants missing work samples or CVs (list them by name — staff will want to chase these), unrecognized Time-and-Room values.

**CV privacy note (accepted risk):** CV PDFs frequently contain the artist's own email/phone. They ship intact by explicit owner decision — judges expect CVs to be complete. Do not attempt PDF redaction.

---

## 5. Privacy Rules (summary)

| Judge site shows | Never leaves the fetch machine |
|---|---|
| Name, City, **Country**, medium | Email, Phone |
| Bio, Proposal, Artwork Descriptions | Street, House/apt#, Zipcode, State |
| Plans for Archive, Writing Samples | Referrer, "How did you hear about us?" |
| Work Samples, CV PDFs | Special Requirements (staff-only) |
| Normalized room/term + flexibility note, Past Residency, LA flag, Anything Else, external links | |

---

## 6. "Time and Room" Normalization

The Notion multi-select mixes canonical options with free-text answers that became options. Normalize each applicant's selections into:

- `roomRequests`: array of `{ room, term, price }` for values matching canonical patterns
- `flexibilityNote`: concatenation of all non-canonical values, displayed verbatim in quotes

**Canonical rooms** (regex, case-insensitive, tolerant of spacing):
- `Michael Kirw[ai]n Solarium` → room: "Michael Kirwan Solarium", price: "$650/mo"  ← *merge Kirwin/Kirwan spelling variants*
- `Lawton'?s Lookout` → price "$375/mo"
- `The Music Room` → price "$650/mo"
- `The Masters'? Room` → price omitted (none in source)

**Term extraction:** parse the month-range suffix (e.g., "August-October 2026", "November 2026-January 2027", "July- September 2026" — tolerate stray spaces/hyphens) into `term: "Aug–Oct 2026"` display form.

Any selected value not matching a canonical pattern (e.g., "im open", "Whatever fits the bill!", "Open to discussion.", the long free-text sentences) goes to `flexibilityNote`. Nothing is discarded. Log unmatched values in the fetch summary so new free-text pollution next year is caught.

---

## 7. Site Design

### 7.1 Design direction

Gallery, not dashboard. The artwork is the protagonist; the interface recedes.

- **Palette:** deep charcoal ground (not pure black — e.g., `#141210` family with a faint warm cast recalling leather and archival paper), off-white text (`#EDE8E0` family), a single restrained accent drawn from ToFF's world — a leather-brown/oxblood tone — used only for interactive states and the score button. No gradients, no decorative color.
- **Typography:** a characterful display face for artist names and page titles (something with presence and slight severity — a modern grotesque or a sharp serif; choose deliberately, not Inter/default), quiet humanist sans for body text, small-caps or letterspaced utility style for labels (CITY · COUNTRY · MEDIUM). Generous line-height on long proposals — judges read thousands of words.
- **Signature element:** the uncropped masonry grid itself — artwork at native aspect ratio on the dark ground, like prints pinned to a studio wall. Spend restraint everywhere else.
- **Quality floor:** responsive to tablet (judges will use iPads), visible keyboard focus, `prefers-reduced-motion` respected, no layout shift as images load (reserve space from known dimensions).

### 7.2 Pages

**`/2026/` — Index grid**
- Masonry grid of applicant cards. Each card: hero work-sample image at **native aspect ratio (never cropped)**; caption band with name (display face), medium, City · Country, and small chips for requested room(s).
- Controls (top, quiet): text search (name/medium/bio), filter by room, filter by country, filter LA yes/no; sort by name / by room. All client-side.
- A subtle per-judge "scored ✓" badge on cards the current browser has scored (localStorage; see 7.4).
- Applicants with zero work samples get a typographic placeholder card (name set large in the display face) — never a broken-image icon.

**`/2026/artist/{slug}/` — Detail page** (order is intentional; do not rearrange)
1. **Work samples** — full-width gallery: large images, lightbox on click (lightbox serves the original file), swipe/arrow navigation. Artwork Descriptions displayed beneath the gallery; if descriptions are clearly enumerated per image, pair them; otherwise render as a single block titled "About the works."
2. **Proposal ‖ Biography** — two columns on desktop (proposal left, wider; bio right), stacked on tablet. The proposal is co-equal with the portfolio for a residency decision.
3. **Logistics band** — room/term chips with price, flexibility note in quotes beneath, Past Residency flag, LA flag, Plans for Archive.
4. **Collapsed sections** — "View CV" expander → embedded PDF (native `<embed>/<iframe>`, lazy-loaded, download link alongside). "Writing samples" expander if long (>800 chars). "Anything else" expander. External links row (website / social / video-audio URLs) as quiet buttons.
5. **Persistent elements:** prev/next applicant arrows (fixed, plus ← → keyboard bindings), "Back to all," and the **Score this artist** button (accent color, always visible — sticky on scroll).

**`/2026/compare/` — Compare mode**
- Judges pin up to 3 artists from grid or detail pages (pin icon; localStorage).
- Synchronized columns, aligned rows: image strip (each independently scrollable) → name/medium/location → proposal excerpt (first ~600 chars, "read full" link) → room/term chips → Score button per column.
- Empty state invites: "Pin artists from the grid to compare them here."

**`/2026/how-to-review/` — Judge instructions**
- Renders Appendix C. Linked prominently from the index header. The password email to judges links directly here.

### 7.3 Scoring integration

- Score button opens the pre-filled Google Form (new tab) with artist name populated.
- **Judge-name memory:** first time a judge scores, the site asks their name once (simple prompt/modal), stores in localStorage, and thereafter substitutes `{{judgeName}}` into pre-fill links too — both form fields arrive filled.
- After opening a score link, mark that artist "scored ✓" locally. Include a small "reviewed n of N" progress indicator in the header. This is per-browser convenience only, never shared, never displayed to others — preserving blind judging.

### 7.4 Access control

- **Vercel Edge Middleware shared-password gate** (works on free tier): minimalist password page; on success set an HTTP-only signed cookie (30-day expiry); middleware checks cookie on every request including assets. Password compared against `SITE_PASSWORD` env var. This is real server-side gating — do **not** implement a client-side JS password check.
- `robots.txt` disallow all; `noindex` meta on every page.

### 7.5 Performance

- Pages serve web-sized images; originals only via lightbox.
- Lazy-load below-the-fold images and all PDF embeds.
- Target: index grid interactive < 2s on hotel Wi-Fi; no image > 400KB in grid/detail (excluding lightbox originals).

---

## 8. Scoring System

### 8.1 Google Form (Nolan creates; see Appendix B)

Fields:
1. **Your name** (short answer, required) — pre-filled by site after first score
2. **Artist** (short answer, required) — pre-filled by site; instruct judges not to edit
3. **Artistic Merit** (1–5 linear scale)
4. **Strength of Proposal** (1–5) — clarity, ambition, feasibility of the residency plan
5. **Resonance with the Foundation's Mission** (1–5) — engagement with Tom's legacy, the archive, queer/leather culture
6. **Readiness** (1–5) — career stage fit, ability to make use of the residency now
7. **Comments** (paragraph, optional)

Settings — required for blind judging:
- Settings → Presentation → **"Show summary charts and text responses": OFF**
- Settings → Responses → **"Allow response editing": OFF**; "Limit to 1 response": OFF (don't force Google sign-in)
- Responses → link to a Sheet; share the Sheet with staff only, never judges.

*(Criteria above are a recommendation encoding proposal-and-mission weight appropriate to a residency; Nolan may rename/reweight before creating the form — this is a curatorial decision.)*

### 8.2 Score calculation

- **Judge composite** per artist = mean of the four criteria (equal weight).
- **Artist final score** = mean of judge composites **across judges who scored that artist** (missing judges don't penalize).
- Report **judge coverage** (n of total judges) beside every final score; treat artists with coverage below the median cautiously in deliberation.
- **Duplicate handling:** if a judge submits twice for the same artist, the **latest submission wins**.
- **Tiebreak order:** Artistic Merit average, then Mission Resonance average.

### 8.3 Staff results view — "Results" tab in the response Sheet

Claude Code (or Nolan, following the runbook) adds a second tab to the response Sheet named **Results**, built once with formulas so it stays live as scores arrive. Staff open this one tab and see the standings; no formula knowledge needed.

Columns per artist row: Artist · Judges scored (n) · Artistic Merit avg · Proposal avg · Mission avg · Readiness avg · **Final score** · Rank.

Implementation notes:
- Deduplicate to latest per (judge, artist): helper tab with `SORTN(SORT(A2:H, timestamp_col, FALSE), 9^9, 2, judge_col&artist_col, TRUE)` pattern (or equivalent QUERY), then Results reads from the deduped range with `AVERAGEIF`s.
- `Final score` = average of the four criterion averages? **No** — compute per-judge composite first in the helper tab (mean of that judge's four scores), then `AVERAGEIF` composites per artist. (Equivalent when all judges complete all criteria, correct when they don't.)
- Conditional formatting: green scale on Final score; red flag on coverage < half of judges.
- A header cell notes the scoring deadline and "last updated: live."
- Provide the exact formulas in `RUNBOOK.md` §Scoring so the tab can be rebuilt from scratch next cohort in ten minutes.

---

## 9. Deliverables Checklist

The build is complete only when **all** exist:

1. **The site** — deployed on Vercel, password-gated, all pages per §7, populated with real 2026 data.
2. **`RUNBOOK.md`** — future-cohort renewal manual (Appendix A), written for a non-developer.
3. **Pre-work checklist** — Appendix B, delivered to Nolan (also kept at top of RUNBOOK).
4. **Judge instructions** — Appendix C as `/2026/how-to-review/` page + `JUDGES.md`.
5. **Scoring apparatus** — Google Form configured (Nolan creates form; Claude Code verifies pre-fill URL wiring), response Sheet with working Results tab, formulas documented.
6. `DECISIONS.md`, `CLAUDE.md`, `.env.example`.

---

## 10. Acceptance Criteria

- [ ] `node scripts/fetch.mjs --cohort 2026` completes with a summary report; re-running is incremental.
- [ ] Zero hidden-field values (email, phone, street, apt, zip, state, referrer, hear-about, special requirements) present anywhere under `/data` or `/public` — automated check passes.
- [ ] Every applicant renders; applicants without images get the typographic card, without CV the expander is absent (not broken).
- [ ] Images uncropped in grid; lightbox serves originals; no grid image > 400KB.
- [ ] CV PDFs render in-page on desktop Chrome/Safari and iPad Safari; download link works.
- [ ] Compare mode: pin 3 from grid, rows align, unpin works, state survives reload.
- [ ] Score button on a test artist opens the form with artist (and, after first use, judge name) pre-filled; submission appears in Sheet; Results tab updates.
- [ ] Password gate: wrong password rejected server-side; direct asset URLs also gated; cookie persists ~30 days.
- [ ] Keyboard: ← → navigate applicants; focus states visible; reduced-motion respected.
- [ ] Search/filters work on index.
- [ ] Changing `cohortTitle` in config and re-running fetch+build changes the site with zero source edits (renewal smoke test).
- [ ] `noindex` + robots.txt present.

---

## 11. Build Order (for Claude Code)

1. Scaffold repo, config, `.env.example`, `CLAUDE.md`.
2. Fetch script incl. normalization + privacy check → generate real data, review summary with Nolan (esp. missing work samples list).
3. Index grid → detail page → compare → password middleware → how-to-review page.
4. Scoring wiring (needs Form ID + entry IDs from Nolan — see Appendix B; use placeholders until provided).
5. Results tab + RUNBOOK + polish pass with screenshots.
6. Deploy, run full acceptance list, hand over.

---

## 12. Model & Token Strategy (for the operator)

| Phase | Model | Why |
|---|---|---|
| Spec & thinking | Fable/Opus-class (done, in chat) | Judgment-heavy |
| Build §11 steps 1–2 | **Sonnet 4.6** | Well-specified code |
| Build §11 steps 3–5 (visual) | **Sonnet 4.6 — do not downgrade** | Frontend quality is the product; iterate with screenshots |
| Fixes, config edits, renewal runs | **Haiku 4.5** | Mechanical; RUNBOOK-driven |
| Stuck bug (2 failed attempts) | Opus, for that problem only | Then switch back |

Token habits: `/clear` between phases; `CLAUDE.md` points to SPEC so fresh sessions self-orient; never paste `applicants.json` into chat — let scripts read/write disk; paste screenshots instead of describing visuals.

---
---

# Appendix A — RUNBOOK: Renewing the Site for a Future Cohort

*Audience: whoever runs next year's review — no coding experience assumed beyond copy-pasting terminal commands. Time: ~1–2 hours if the application form is unchanged.*

**A1. Duplicate the config.** Copy `/config/2026.json` → `/config/2027.json`. Update: `cohort`, `cohortTitle`, `notionDatabaseId` + `notionDataSourceId` (from the new year's Notion database — open it, copy the ID from the URL), `scoringDeadline`.

**A2. Check for schema drift.** If the application form questions changed, property names in Notion changed. Run `node scripts/fetch.mjs --cohort 2027 --dry-run`; the script lists any expected-but-missing or new-and-unmapped properties. Fix by editing the `fields` lists in the config — names must match Notion exactly, including stray spaces. **New fields are hidden by default** until added to `visible` — privacy-safe by design.

**A3. Notion access.** Ensure the Notion integration (see B1) is shared with the *new* database: in Notion, open the database → ⋯ menu → Connections → add the integration. Token stays the same unless revoked.

**A4. Fetch.** `node scripts/fetch.mjs --cohort 2027`. Read the summary: chase applicants flagged as missing work samples/CVs before judging begins; check "unrecognized Time-and-Room values" and extend `normalize.mjs` patterns only if a new *canonical* room appears (free-text noise handles itself).

**A5. New scoring form.** Make a copy of the previous Google Form (File → Make a copy). In the copy: update title/year, verify settings per SPEC §8.1. Get a fresh pre-filled link (⋯ → Get pre-filled link → type placeholder text in Name and Artist → Get link) and paste it into the config's `scoreFormPrefillTemplate`, replacing the placeholder text with `{{judgeName}}` and `{{artistName}}`. Link responses to a new Sheet; rebuild the Results tab per RUNBOOK §Scoring formulas.

**A6. New password.** Set a new value for `SITE_PASSWORD` in Vercel (Project → Settings → Environment Variables). One password per cohort.

**A7. Deploy.** Commit and push; Vercel builds automatically. New cohort appears at `/2027/`; update the root redirect in config. Previous years remain live at their paths as archive.

**A8. Smoke test** (10 min): open site in a private window → password works → grid shows correct count → open 2 artists → CV renders → score a test artist → submission appears in Sheet → Results tab computes → delete the test row.

*Cheapest execution: open Claude Code on Haiku, say "Follow RUNBOOK.md to set up the 2027 cohort; the new Notion database ID is X." *

---

# Appendix B — Pre-Work Checklist (Nolan)

**Must happen BEFORE the build starts:**
- [ ] **B1. Notion integration.** notion.so/my-integrations → New integration ("ToFF Review Site"), workspace = ToFF, capabilities: read content only. Copy the token (starts `ntn_`/`secret_`). In Notion, open the Applications database → ⋯ → Connections → add the integration. Give the token to Claude Code as `NOTION_TOKEN` in `.env` — never paste it into chat logs or commit it.
- [ ] **B2. Accounts.** Confirm GitHub + Vercel accounts (free tiers fine) and that Claude Code can push/deploy (Vercel CLI login).

**Can happen DURING/AFTER the build (needed before step 4 of §11):**
- [ ] **B3. Decide scoring criteria** — confirm or amend the four in §8.1 (curatorial call).
- [ ] **B4. Create the Google Form** per §8.1, apply the three settings, link a response Sheet, generate the pre-filled link, hand Form pre-fill URL to Claude Code.
- [ ] **B5. Choose the shared password** and set it in Vercel env vars.
- [ ] **B6. Data hygiene in Notion** (fetch summary will help): chase applicants missing work samples or CVs; skim for duplicate submissions.

**Before judges get the link:**
- [ ] **B7. Send the judge email:** site URL, password, link to `/how-to-review`, deadline, confidentiality line. (Draft on request — it should carry the ToFF voice.)

---

# Appendix C — Instructions for Judges (site page `/how-to-review`)

**Reviewing the 2026 Residency Applications**

Welcome — and thank you. This site holds every application to the 2026 Tom of Finland Foundation Artist Residency. Here is how to work through them.

**Getting in.** Use the link and password from your invitation email. The site works on laptop and iPad; a larger screen serves the artwork best.

**Browsing.** The front page shows every applicant through their work. Click any card for the full application: work samples first, then their proposal and biography side by side, their requested room and dates, and their CV (under "View CV"). Use the ← → arrows — on screen or keyboard — to move straight to the next applicant.

**Comparing.** When you're weighing finalists against each other, tap the pin icon on up to three artists, then open **Compare** in the header to see them side by side.

**Scoring.** On each artist's page, press **Score this artist**. A short form opens with the artist's name already filled in — enter your scores (1–5 on four criteria) and any comments, and submit. The first time, you'll be asked your name once; after that it fills itself in. A ✓ appears on artists you've scored, and the header shows your progress.

**Three ground rules.**
1. **Score independently.** No judge can see another's scores, by design — please don't discuss ratings with fellow judges until deliberation. First impressions belong to you alone.
2. **Score every applicant** you can, even briefly — coverage keeps the final tally fair.
3. **Confidentiality.** Applications contain artists' unpublished work and personal statements. Please don't share the link, the password, or any materials outside the committee.

**Deadline:** please complete all scores by **{{scoringDeadline}}**. Questions → Nolan Feng, nolan@tomoffinland.org.

---

# Appendix D — How the Final Score Works (staff reference)

1. Each judge rates each artist on four criteria, 1–5: Artistic Merit · Strength of Proposal · Resonance with the Foundation's Mission · Readiness.
2. A judge's **composite** for an artist = the average of their four ratings.
3. An artist's **final score** = the average of composites across the judges who scored them (an unscored artist–judge pair is excluded, not counted as zero).
4. If a judge submits twice for the same artist, only their **latest** submission counts.
5. Ties break on Artistic Merit average, then Mission Resonance average.
6. **Where staff see it:** open the response Sheet → **Results** tab. It updates live as scores arrive: every artist ranked, per-criterion averages, final score, and how many judges have scored them. Rows flagged in red have thin coverage (fewer than half the judges) — treat those rankings as provisional and nudge the judges who are behind. No formulas to touch; if the tab ever breaks, RUNBOOK §Scoring rebuilds it.
