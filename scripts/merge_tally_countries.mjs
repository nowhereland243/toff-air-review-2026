import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const submissions = JSON.parse(fs.readFileSync(path.resolve(ROOT_DIR, 'data', 'tally_submissions_debug.json'), 'utf8'));
const applicantsPath = path.resolve(ROOT_DIR, 'data', '2026', 'applicants.json');
const applicants = JSON.parse(fs.readFileSync(applicantsPath, 'utf8'));

function normalizeName(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, ' ') // replace punctuation with space
    .trim()
    .replace(/\s+/g, ' ');
}

// Extract Tally records using exact question IDs
const tallyRecords = [];

submissions.forEach(sub => {
  let firstName = '';
  let lastName = '';
  let country = '';
  let city = '';

  const responses = sub.responses || [];
  responses.forEach(r => {
    const qId = r.questionId;
    const val = Array.isArray(r.answer) ? r.answer.join(', ') : (r.answer || '');

    if (qId === 'rPXX7N') firstName = val.trim();
    else if (qId === '4rZZeX') lastName = val.trim();
    else if (qId === 'vAPpPQ') country = val.trim();
    else if (qId === 'eRbbke') city = val.trim();
  });

  const fullName = `${firstName} ${lastName}`.trim();
  const normalized = normalizeName(fullName);

  if (normalized) {
    tallyRecords.push({
      fullName,
      normalized,
      country,
      city,
    });
  }
});

console.log(`Loaded ${tallyRecords.length} Tally respondent records.`);

// Merge country data into applicants.json
let matchedCount = 0;

applicants.forEach(app => {
  const normApp = normalizeName(app.fullName);

  // Exact or Token Subset Match
  let match = tallyRecords.find(t => t.normalized === normApp);

  if (!match) {
    // Try matching if all tokens of applicant name exist in Tally record or vice versa
    const appTokens = normApp.split(' ');
    match = tallyRecords.find(t => {
      const tallyTokens = t.normalized.split(' ');
      return appTokens.every(tok => t.normalized.includes(tok)) ||
             tallyTokens.every(tok => normApp.includes(tok));
    });
  }

  if (match) {
    matchedCount++;
    if (match.country) app.country = match.country;
    if (match.city && (!app.city || app.city === 'Unknown')) app.city = match.city;
  } else {
    console.log(`WARN: No match for "${app.fullName}" (${normApp})`);
  }
});

console.log(`\nMatched ${matchedCount} / ${applicants.length} applicants!`);

// Save updated applicants.json
fs.writeFileSync(applicantsPath, JSON.stringify(applicants, null, 2));
console.log(`Saved updated dataset to ${applicantsPath}`);
