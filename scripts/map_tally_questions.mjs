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

async function getFormStructure() {
  const res = await fetch('https://api.tally.so/forms/aQOd49', {
    headers: {
      'Authorization': `Bearer ${TALLY_API_KEY}`,
      'Content-Type': 'application/json',
    }
  });

  const formData = await res.json();
  console.log('Form structure fields/questions:');
  const fields = formData.fields || formData.blocks || [];
  fields.forEach(f => {
    console.log(`QuestionID: ${f.id} | Type: ${f.type} | Label: ${f.title || f.label || f.name}`);
  });

  fs.writeFileSync(path.resolve(ROOT_DIR, 'data', 'tally_form_structure.json'), JSON.stringify(formData, null, 2));
}

getFormStructure().catch(err => console.error(err));
