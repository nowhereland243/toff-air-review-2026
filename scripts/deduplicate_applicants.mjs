import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const applicantsPath = path.resolve(ROOT_DIR, 'data', '2026', 'applicants.json');
const applicants = JSON.parse(fs.readFileSync(applicantsPath, 'utf8'));

function normalizeName(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Group applicants by normalized name
const groups = {};
applicants.forEach(app => {
  const norm = normalizeName(app.fullName);
  if (!norm || app.fullName === 'Unknown') return; // skip dummy
  if (!groups[norm]) groups[norm] = [];
  groups[norm].push(app);
});

console.log(`Initial total applicants: ${applicants.length}`);

const duplicates = Object.values(groups).filter(g => g.length > 1);
console.log(`Found ${duplicates.length} duplicate groups:\n`);

duplicates.forEach((g, idx) => {
  console.log(`Group ${idx + 1}: "${g[0].fullName}" (${g.length} submissions)`);
  g.forEach((item, itemIdx) => {
    console.log(`  Sub ${itemIdx + 1} (id: ${item.id}):`);
    console.log(`    - Work Samples: ${item.workSamples?.length || 0}`);
    console.log(`    - CV Files: ${item.cvFiles?.length || 0}`);
    console.log(`    - Proposal length: ${item.proposal?.length || 0}`);
    console.log(`    - Bio length: ${item.bio?.length || 0}`);
    console.log(`    - Room requests: ${item.roomRequests?.length || 0}`);
    console.log(`    - Country: "${item.country || ''}" | City: "${item.city || ''}"`);
  });
  console.log('---');
});

// Deduplicate & Merge logic
const cleanApplicants = [];
const processedNorms = new Set();

applicants.forEach(app => {
  const norm = normalizeName(app.fullName);
  if (!norm || app.fullName === 'Unknown') return; // filter out empty/dummy
  if (processedNorms.has(norm)) return;
  processedNorms.add(norm);

  const group = groups[norm];
  if (group.length === 1) {
    cleanApplicants.push(group[0]);
  } else {
    // Sort group by completeness (work samples count, proposal length, bio length) descending
    group.sort((a, b) => {
      const scoreA = (a.workSamples?.length || 0) * 100 + (a.proposal?.length || 0) + (a.bio?.length || 0);
      const scoreB = (b.workSamples?.length || 0) * 100 + (b.proposal?.length || 0) + (b.bio?.length || 0);
      return scoreB - scoreA;
    });

    const primary = { ...group[0] };

    // Merge non-empty fields from secondary submissions
    for (let i = 1; i < group.length; i++) {
      const sec = group[i];

      // Merge unique work samples
      if (sec.workSamples && sec.workSamples.length > 0) {
        const existingNames = new Set((primary.workSamples || []).map(w => w.name));
        sec.workSamples.forEach(ws => {
          if (!existingNames.has(ws.name)) {
            primary.workSamples = primary.workSamples || [];
            primary.workSamples.push(ws);
          }
        });
      }

      // Merge unique CV files
      if (sec.cvFiles && sec.cvFiles.length > 0) {
        const existingCv = new Set((primary.cvFiles || []).map(c => c.name));
        sec.cvFiles.forEach(cv => {
          if (!existingCv.has(cv.name)) {
            primary.cvFiles = primary.cvFiles || [];
            primary.cvFiles.push(cv);
          }
        });
      }

      // Merge non-empty scalar fields if primary is empty
      if (!primary.country && sec.country) primary.country = sec.country;
      if (!primary.city && sec.city) primary.city = sec.city;
      if (!primary.website && sec.website) primary.website = sec.website;
      if (!primary.instagram && sec.instagram) primary.instagram = sec.instagram;
      if (!primary.flexibilityNote && sec.flexibilityNote) primary.flexibilityNote = sec.flexibilityNote;
      if ((!primary.proposal || primary.proposal.length < sec.proposal?.length) && sec.proposal) {
        primary.proposal = sec.proposal;
      }
      if ((!primary.bio || primary.bio.length < sec.bio?.length) && sec.bio) {
        primary.bio = sec.bio;
      }
    }

    cleanApplicants.push(primary);
  }
});

// Sort clean applicants alphabetically by lastName / fullName
cleanApplicants.sort((a, b) => {
  const nameA = a.lastName || a.fullName;
  const nameB = b.lastName || b.fullName;
  return nameA.localeCompare(nameB);
});

console.log(`\nDeduplication Complete! Reduced dataset from ${applicants.length} to ${cleanApplicants.length} clean applicants.`);

// Save back to applicants.json
fs.writeFileSync(applicantsPath, JSON.stringify(cleanApplicants, null, 2));
console.log(`Saved deduplicated applicants to ${applicantsPath}`);
