# Decision Log

Log of architectural choices and technical decisions made where `SPEC.md` was silent or provided recommendations.

---

### Decision 1: Node.js ES Modules for Fetch Tooling
- **Context:** Scripts need to perform Notion API fetching, file downloads, privacy sanitization, image processing via Sharp, and JSON generation.
- **Choice:** Native ES Modules (`"type": "module"` in `package.json`, `.mjs` extensions).
- **Rationale:** Standard, modern Node.js pattern without requiring a build/transpilation step for CLI tools.

---

### Decision 2: Slugification Strategy
- **Context:** Applicant files need to be saved cleanly to `/public/assets/2026/{slug}/...` and mapped in JSON.
- **Choice:** `lastname-firstname`, lowercased, non-ASCII characters transliterated to standard ASCII (e.g. accents removed), non-alphanumeric replaced with hyphens, deduplicated with numeric suffix (`-2`, `-3`) if identical names occur.
- **Rationale:** Ensures safe, reliable URL and file path handling across operating systems and web servers.

---

### Decision 3: Tally.so for Blind Scoring Forms
- **Context:** The site provides a pre-filled link on each artist's page for judges to submit blind scores.
- **Choice:** Use Tally.so instead of Google Forms.
- **Rationale:** Tally provides clean URL query parameters (`https://tally.so/r/FORM_ID?artist={{artistName}}&judge={{judgeName}}`), a free API, direct MCP integration options, clean default blind-response settings, and seamless CSV/Google Sheets export.

