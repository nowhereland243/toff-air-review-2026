# Claude Code Instructions — ToFF Residency Review Site

- **Authoritative Spec:** Read [SPEC.md](file:///Users/nolanfeng/Project/TOFF%20-%20Air%20Review%20-%20Antigravity/SPEC.md) before making structural or schema changes.
- **Current Phase:** Phase 1 (Steps 1–2 of §11 Build Order) — Data Scaffolding & Fetching.
- **Key Files:**
  - Config: `config/2026.json`
  - Fetch script: `scripts/fetch.mjs`
  - Normalization: `scripts/lib/normalize.mjs`
  - Data output: `data/2026/applicants.json`
- **Commands:**
  - `npm install` — install dependencies
  - `node scripts/fetch.mjs --cohort 2026` — fetch Notion data, optimize images, download PDFs
  - `node scripts/fetch.mjs --cohort 2026 --force` — re-download all assets
