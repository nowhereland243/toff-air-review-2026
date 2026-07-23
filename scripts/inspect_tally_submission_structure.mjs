import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const debugPath = path.resolve(ROOT_DIR, 'data', 'tally_submissions_debug.json');
const submissions = JSON.parse(fs.readFileSync(debugPath, 'utf8'));

if (submissions.length > 0) {
  const sub = submissions[0];
  console.log('Submission ID:', sub.id);
  console.log('Fields in sub:', Object.keys(sub));

  // Print all fields in sub.responses or sub.data or sub.fields
  const responses = sub.responses || sub.data || sub.fields || sub;
  if (Array.isArray(responses)) {
    console.log('Response array items count:', responses.length);
    responses.forEach((r, idx) => {
      console.log(`[${idx}] questionId: ${r.questionId} | answer: ${JSON.stringify(r.answer)}`);
    });
  } else {
    console.log('Responses object:', JSON.stringify(responses, null, 2));
  }
}
