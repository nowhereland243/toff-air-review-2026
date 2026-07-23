import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const formData = JSON.parse(fs.readFileSync(path.resolve(ROOT_DIR, 'data', 'tally_form_structure.json'), 'utf8'));

const blocks = formData.blocks || [];
console.log(`Total blocks: ${blocks.length}`);

blocks.forEach((b, i) => {
  if (b.type && (b.type.includes('INPUT') || b.type.includes('TITLE') || b.type.includes('HEADING') || b.type.includes('TEXT'))) {
    console.log(`Block ${i} [${b.type}] (id: ${b.id}, key: ${b.key}): ${JSON.stringify(b.payload?.text || b.payload?.title || b.payload || '')}`);
  }
});
