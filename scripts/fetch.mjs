import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { normalizeTimeAndRoom } from './lib/normalize.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// CLI args parsing
const args = process.argv.slice(2);
let cohort = '2026';
let force = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--cohort' && args[i + 1]) {
    cohort = args[i + 1];
    i++;
  } else if (args[i] === '--force') {
    force = true;
  }
}

const CONFIG_PATH = path.join(ROOT_DIR, 'config', `${cohort}.json`);
if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`Config file not found: ${CONFIG_PATH}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

if (!process.env.NOTION_TOKEN) {
  console.error('ERROR: NOTION_TOKEN environment variable is missing.');
  console.error('Please create a .env file containing NOTION_TOKEN=secret_xxx or export it in your environment.');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Transliterate & slugify names
function slugify(lastName, firstName) {
  const combined = `${lastName || ''}-${firstName || ''}`.trim() || 'applicant';
  return combined
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Notion Property Extractor Helper
function extractPropValue(prop) {
  if (!prop) return null;
  switch (prop.type) {
    case 'title':
      return prop.title?.map(t => t.plain_text).join('') || '';
    case 'rich_text':
      return prop.rich_text?.map(t => t.plain_text).join('') || '';
    case 'select':
      return prop.select?.name || null;
    case 'multi_select':
      return prop.multi_select?.map(s => s.name) || [];
    case 'files':
      return prop.files?.map(f => ({
        name: f.name,
        url: f.type === 'file' ? f.file?.url : f.external?.url
      })) || [];
    case 'url':
      return prop.url || null;
    case 'email':
      return prop.email || null;
    case 'phone_number':
      return prop.phone_number || null;
    case 'checkbox':
      return prop.checkbox ?? false;
    case 'number':
      return prop.number ?? null;
    default:
      return null;
  }
}

// Download file helper (idempotent)
async function downloadFile(url, destPath) {
  if (!force && fs.existsSync(destPath)) {
    const stats = fs.statSync(destPath);
    if (stats.size > 0) {
      return true; // Skip existing
    }
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
  return false; // Newly downloaded
}

// Main fetch function
async function main() {
  console.log(`Starting fetch for cohort ${cohort}...`);

  const databaseId = config.notionDatabaseId;
  let hasMore = true;
  let startCursor = undefined;
  const rawPages = [];

  // 1. Paginated Query of Notion Database
  while (hasMore) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
      page_size: 100
    });

    rawPages.push(...response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;

    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 350)); // Rate limit backoff (~3 req/s)
    }
  }

  console.log(`Fetched ${rawPages.length} records from Notion database.`);

  const slugMap = new Map();
  const applicants = [];
  const missingWorkSamples = [];
  const missingCVs = [];
  const allUnrecognizedRooms = [];

  let totalImagesDownloaded = 0;
  let totalPdfsDownloaded = 0;

  // Track hidden field string values to verify privacy check later
  const hiddenFieldValuesToAudit = new Set();

  for (const page of rawPages) {
    const props = page.properties;

    // Collect hidden field values for the hard privacy verification check
    for (const hiddenPropName of config.fields.hidden) {
      if (props[hiddenPropName]) {
        const val = extractPropValue(props[hiddenPropName]);
        if (typeof val === 'string' && val.trim().length > 3) {
          hiddenFieldValuesToAudit.add(val.trim());
        }
      }
    }

    const firstName = extractPropValue(props['First Name']) || '';
    const lastName = extractPropValue(props[config.fields.title]) || extractPropValue(props['Last Name']) || 'Unknown';

    let baseSlug = slugify(lastName, firstName);
    let slug = baseSlug;
    let count = slugMap.get(baseSlug) || 0;
    if (count > 0) {
      slug = `${baseSlug}-${count + 1}`;
    }
    slugMap.set(baseSlug, count + 1);

    const fullName = `${firstName} ${lastName}`.trim();

    // Assets paths setup
    const applicantAssetWebDir = path.join(ROOT_DIR, 'public', 'assets', cohort, slug, 'work', 'web');
    const applicantAssetOrigDir = path.join(ROOT_DIR, 'public', 'assets', cohort, slug, 'work', 'original');
    const applicantCvDir = path.join(ROOT_DIR, 'public', 'assets', cohort, slug, 'cv');

    // Process Work Samples
    const rawWorkSamples = extractPropValue(props['Work Samples']) || [];
    const workSamples = [];

    if (!Array.isArray(rawWorkSamples) || rawWorkSamples.length === 0) {
      missingWorkSamples.push(fullName);
    } else {
      for (let idx = 0; idx < rawWorkSamples.length; idx++) {
        const item = rawWorkSamples[idx];
        if (!item.url) continue;

        const extMatch = item.url.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
        const originalExt = extMatch ? extMatch[1].toLowerCase() : 'jpg';
        const origFilename = `sample-${idx + 1}.${originalExt}`;
        const origPath = path.join(applicantAssetOrigDir, origFilename);
        
        await downloadFile(item.url, origPath);
        totalImagesDownloaded++;

        // Process Web Image via Sharp
        const webFilename = `sample-${idx + 1}.jpg`;
        const webPath = path.join(applicantAssetWebDir, webFilename);

        fs.mkdirSync(applicantAssetWebDir, { recursive: true });

        if (force || !fs.existsSync(webPath)) {
          try {
            await sharp(origPath)
              .resize({ width: config.imageMaxWidth || 1600, withoutEnlargement: true })
              .jpeg({ quality: 82 })
              .toFile(webPath);
          } catch (err) {
            console.warn(`Sharp image processing warning for ${origPath}: ${err.message}. Copying original.`);
            fs.copyFileSync(origPath, webPath);
          }
        }

        const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'].includes(originalExt);

        workSamples.push({
          name: item.name || `Work Sample ${idx + 1}`,
          original: `/assets/${cohort}/${slug}/work/original/${origFilename}`,
          web: `/assets/${cohort}/${slug}/work/web/${webFilename}`,
          isImage: isImg,
          ext: originalExt
        });
      }
    }

    // Process Resume/CV
    const rawCv = extractPropValue(props['Resume/CV']) || [];
    const cvFiles = [];

    if (!Array.isArray(rawCv) || rawCv.length === 0) {
      missingCVs.push(fullName);
    } else {
      for (let idx = 0; idx < rawCv.length; idx++) {
        const item = rawCv[idx];
        if (!item.url) continue;

        const extMatch = item.url.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : 'pdf';
        const cvFilename = `cv-${idx + 1}.${ext}`;
        const cvPath = path.join(applicantCvDir, cvFilename);

        await downloadFile(item.url, cvPath);
        totalPdfsDownloaded++;

        cvFiles.push({
          name: item.name || `Resume/CV ${idx + 1}`,
          path: `/assets/${cohort}/${slug}/cv/${cvFilename}`
        });
      }
    }

    // Normalize Time and Room
    const rawTimeAndRoom = extractPropValue(props['Time and Room']);
    const normalizedTimeAndRoom = normalizeTimeAndRoom(rawTimeAndRoom);
    if (normalizedTimeAndRoom.unrecognizedValues.length > 0) {
      allUnrecognizedRooms.push(...normalizedTimeAndRoom.unrecognizedValues);
    }

    // Build Score Form Prefill URL
    let scoreUrl = null;
    if (config.scoreFormPrefillTemplate) {
      scoreUrl = config.scoreFormPrefillTemplate.replace('{{artistName}}', encodeURIComponent(fullName));
    }

    // Helper to redact any accidental email addresses in text fields
    const sanitizeText = (str) => {
      if (typeof str !== 'string') return str;
      return str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email redacted]');
    };

    // Build Judge-Safe Applicant Record (strictly visible fields only)
    const applicantRecord = {
      id: page.id,
      slug,
      firstName,
      lastName,
      fullName,
      city: sanitizeText(extractPropValue(props['City']) || ''),
      country: sanitizeText(extractPropValue(props['Country']) || ''),
      medium: sanitizeText(extractPropValue(props['What is your medium?']) || ''),
      bio: sanitizeText(extractPropValue(props['Artist biography']) || ''),
      proposal: sanitizeText(extractPropValue(props[' Proposal']) || ''),
      artworkDescriptions: sanitizeText(extractPropValue(props['Artwork Descriptions']) || ''),
      plansForArchive: sanitizeText(extractPropValue(props['Plans for Archive']) || ''),
      writingSamples: sanitizeText(extractPropValue(props['Writing Samples']) || ''),
      pastResidency: sanitizeText(extractPropValue(props['Past Residency ']) || ''),
      anythingElse: sanitizeText(extractPropValue(props['Anything Else']) || ''),
      website: sanitizeText(extractPropValue(props['Website']) || null),
      socialUrl: sanitizeText(extractPropValue(props['Social URL']) || null),
      otherLinks: sanitizeText(extractPropValue(props['Other Links']) || null),
      videoAudioUrls: sanitizeText(extractPropValue(props['Video/Audio Work Urls']) || null),
      isLA: extractPropValue(props['LA']) || false,
      roomRequests: normalizedTimeAndRoom.roomRequests,
      flexibilityNote: normalizedTimeAndRoom.flexibilityNote ? sanitizeText(normalizedTimeAndRoom.flexibilityNote) : null,
      workSamples,
      cvFiles,
      scoreUrl
    };

    applicants.push(applicantRecord);
  }

  // 3. Write Output & Enforce Privacy Assertions
  const dataDir = path.join(ROOT_DIR, 'data', cohort);
  fs.mkdirSync(dataDir, { recursive: true });
  const outputPath = path.join(dataDir, 'applicants.json');
  const jsonContent = JSON.stringify(applicants, null, 2);

  // PRIVACY CHECK — HARD REQUIREMENT (SPEC §4)
  console.log('Running automated privacy verification check...');

  // Assertion A: Check for email patterns across output JSON
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = jsonContent.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    console.error(`PRIVACY VIOLATION DETECTED: Email pattern(s) found in applicants.json: ${emailMatches.join(', ')}`);
    process.exit(1);
  }

  // Assertion B: Check that no hidden field property names exist in exported JSON
  for (const hiddenPropName of config.fields.hidden) {
    // Check if property key appears in JSON
    const keyPattern = new RegExp(`"${hiddenPropName}"\\s*:`, 'i');
    if (keyPattern.test(jsonContent)) {
      console.error(`PRIVACY VIOLATION DETECTED: Hidden field key "${hiddenPropName}" found in applicants.json`);
      process.exit(1);
    }
  }

  // Assertion C: Check hidden field values of the first record per SPEC §4 step 3
  if (rawPages.length > 0) {
    const firstPageProps = rawPages[0].properties;
    for (const hiddenPropName of config.fields.hidden) {
      const val = extractPropValue(firstPageProps[hiddenPropName]);
      if (typeof val === 'string' && val.trim().length > 5) {
        if (jsonContent.includes(val.trim())) {
          console.error(`PRIVACY VIOLATION DETECTED: First record hidden field "${hiddenPropName}" value "${val}" leaked into applicants.json`);
          process.exit(1);
        }
      }
    }
  }

  console.log('✓ Privacy check passed! Zero hidden fields or email addresses detected in output JSON.');

  fs.writeFileSync(outputPath, jsonContent, 'utf-8');
  console.log(`Saved ${applicants.length} applicants to ${outputPath}`);

  // 4. Summary Report Output
  console.log('\n========================================');
  console.log('         FETCH SUMMARY REPORT           ');
  console.log('========================================');
  console.log(`Total Applicants: ${applicants.length}`);
  console.log(`Images Processed/Downloaded: ${totalImagesDownloaded}`);
  console.log(`PDFs Downloaded: ${totalPdfsDownloaded}`);
  console.log('----------------------------------------');
  console.log(`Applicants Missing Work Samples (${missingWorkSamples.length}):`);
  if (missingWorkSamples.length === 0) {
    console.log('  (None)');
  } else {
    missingWorkSamples.forEach(name => console.log(`  - ${name}`));
  }
  console.log('----------------------------------------');
  console.log(`Applicants Missing CVs (${missingCVs.length}):`);
  if (missingCVs.length === 0) {
    console.log('  (None)');
  } else {
    missingCVs.forEach(name => console.log(`  - ${name}`));
  }
  console.log('----------------------------------------');
  console.log(`Unrecognized Time-and-Room Values (${allUnrecognizedRooms.length}):`);
  if (allUnrecognizedRooms.length === 0) {
    console.log('  (None)');
  } else {
    const uniqueUnrecognized = [...new Set(allUnrecognizedRooms)];
    uniqueUnrecognized.forEach(val => console.log(`  - "${val}"`));
  }
  console.log('========================================\n');
}

main().catch(err => {
  console.error('Fatal error during fetch:', err);
  process.exit(1);
});
