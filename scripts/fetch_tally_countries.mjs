import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load environment variables from .env
const envPath = path.resolve(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const TALLY_API_KEY = process.env.TALLY_API_KEY;

if (!TALLY_API_KEY) {
  console.error('ERROR: TALLY_API_KEY missing from environment.');
  process.exit(1);
}

const FORM_ID = 'aQOd49';

async function fetchAllSubmissions() {
  console.log(`Fetching all submissions for Tally form ID ${FORM_ID}...`);
  let allSubmissions = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://api.tally.so/forms/${FORM_ID}/submissions?page=${page}&limit=100`;
    console.log(`Fetching page ${page}: ${url}...`);
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TALLY_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to fetch page ${page}: ${res.status} ${errText}`);
      break;
    }

    const data = await res.json();
    const items = data.items || data.submissions || data.data || [];
    allSubmissions.push(...items);

    hasMore = data.hasMore || (data.total > allSubmissions.length);
    page++;
    if (items.length === 0) break;
  }

  console.log(`Total Tally submissions retrieved: ${allSubmissions.length}`);

  const debugPath = path.resolve(ROOT_DIR, 'data', 'tally_submissions_debug.json');
  fs.writeFileSync(debugPath, JSON.stringify(allSubmissions, null, 2));
  console.log(`Saved raw submissions to ${debugPath}`);
}

fetchAllSubmissions().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
