import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const debugPath = path.resolve(ROOT_DIR, 'data', 'tally_submissions_debug.json');
const submissions = JSON.parse(fs.readFileSync(debugPath, 'utf8'));

if (submissions.length > 0) {
  const sample = submissions[0];
  console.log('Sample submission keys:', Object.keys(sample));
  console.log('Sample responses:', JSON.stringify(sample.responses || sample.data || sample.fields, null, 2));
}
