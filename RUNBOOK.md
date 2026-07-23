# RUNBOOK — Renewing the Site for Future Cohorts

*Audience: whoever runs next year's review — no coding experience assumed beyond copy-pasting terminal commands. Time required: ~1 hour.*

---

### Step 1: Duplicate the Config
Copy `/config/2026.json` to `/config/2027.json`. Update the following values:
- `"cohort"`: `"2027"`
- `"cohortTitle"`: `"Artist-in-Residence Applications — 2027"`
- `"notionDatabaseId"`: Notion database ID for the 2027 applications database (copied from the Notion URL).
- `"scoringDeadline"`: `"2027-08-15"`

---

### Step 2: Notion Access
Ensure the Notion integration connection is added to the 2027 database:
1. Open the 2027 Applications database in Notion.
2. Click the `⋯` menu at the top right -> **Connections**.
3. Add the **"ToFF Review Site"** integration.

---

### Step 3: Run the Fetch Script
In your terminal, run:
```bash
node scripts/fetch.mjs --cohort 2027
```
Read the summary report printed at the end:
- Chase any applicants flagged as missing work samples or CVs.
- Check "Unrecognized Time-and-Room values" to see if new canonical rooms need adding.

---

### Step 4: Setup the New Tally.so Scoring Form
1. Open your Tally.so account and duplicate the previous cohort's form (or create a new form with the 4 criteria: *Artistic Merit*, *Strength of Proposal*, *Resonance with Mission*, *Readiness*).
2. Add hidden fields for `artist` and `judge` so Tally captures pre-filled query parameters (`?artist=...&judge=...`).
3. Copy your Tally form URL (e.g. `https://tally.so/r/YOUR_FORM_ID`) and paste it into `config/2027.json` as `scoreFormPrefillTemplate`:
   ```json
   "scoreFormPrefillTemplate": "https://tally.so/r/YOUR_FORM_ID?artist={{artistName}}&judge={{judgeName}}"
   ```

---

### Step 5: Results Tab Spreadsheet Setup
If using Google Sheets integration with Tally:
1. Connect Tally responses to a Google Sheet.
2. Add a second tab named **Results**.
3. Use the formula pattern to compute composite judge averages per artist:
   ```excel
   =AVERAGEIF(Responses!B2:B, A2, Responses!C2:C)
   ```
4. Rank applicants using `RANK(G2, G$2:G$114)`.

---

### Step 6: Deploy to Vercel
1. Set a new cohort password in Vercel Environment Variables (`SITE_PASSWORD`).
2. Update the root redirect in `next.config.mjs` to `/2027` if desired.
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Setup 2027 residency cohort"
   git push origin main
   ```
   Vercel will auto-deploy the update.

---

### Step 7: 10-Minute Smoke Test
1. Open the new site URL in an Incognito / Private window.
2. Verify password protection gate prompts for password.
3. Verify applicant count matches Notion.
4. Click into 2 artist profiles: check images, bio, proposal, and PDF viewer.
5. Click **Score this artist**: verify Tally form opens with artist pre-filled.
6. Verify candidate shows `Scored ✓` badge upon return.
