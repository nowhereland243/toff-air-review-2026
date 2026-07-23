import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const formData = JSON.parse(fs.readFileSync(path.resolve(ROOT_DIR, 'data', 'tally_form_structure.json'), 'utf8'));

const blocks = formData.blocks || [];

blocks.slice(0, 25).forEach((b, i) => {
  console.log(`Block ${i} [${b.type}]: ${JSON.stringify(b.payload || {})}`);
});
