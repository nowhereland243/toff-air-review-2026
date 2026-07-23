/**
 * Normalization logic for "Time and Room" selections from Notion.
 * Parses multi-select entries into canonical room requests and flexibility notes.
 */

const MONTH_MAP = {
  january: 'Jan', jan: 'Jan',
  february: 'Feb', feb: 'Feb',
  march: 'Mar', mar: 'Mar',
  april: 'Apr', apr: 'Apr',
  may: 'May',
  june: 'Jun', jun: 'Jun',
  july: 'Jul', jul: 'Jul',
  august: 'Aug', aug: 'Aug',
  september: 'Sep', sept: 'Sep', sep: 'Sep',
  october: 'Oct', oct: 'Oct',
  november: 'Nov', nov: 'Nov',
  december: 'Dec', dec: 'Dec'
};

const CANONICAL_ROOMS = [
  {
    pattern: /Michael\s+Kirw[ai]n\s+Solarium/i,
    room: "Michael Kirwan Solarium",
    price: "$650/mo"
  },
  {
    pattern: /Lawton'?s\s+Lookout/i,
    room: "Lawton's Lookout",
    price: "$375/mo"
  },
  {
    pattern: /The\s+Music\s+Room/i,
    room: "The Music Room",
    price: "$650/mo"
  },
  {
    pattern: /The\s+Masters'?\s+Room/i,
    room: "The Masters' Room",
    price: null
  }
];

function formatMonth(monthStr) {
  if (!monthStr) return '';
  const key = monthStr.trim().toLowerCase();
  return MONTH_MAP[key] || monthStr.trim();
}

/**
 * Extracts term display string from text (e.g. "August-October 2026" -> "Aug–Oct 2026")
 */
function extractTerm(str) {
  if (!str) return null;

  // Pattern 1: Month 20YY - Month 20ZZ (across years)
  const dualYearMatch = str.match(/([a-z]+)\s*(\d{4})\s*[-–—]\s*([a-z]+)\s*(\d{4})/i);
  if (dualYearMatch) {
    const m1 = formatMonth(dualYearMatch[1]);
    const y1 = dualYearMatch[2];
    const m2 = formatMonth(dualYearMatch[3]);
    const y2 = dualYearMatch[4];
    return `${m1} ${y1}–${m2} ${y2}`;
  }

  // Pattern 2: Month - Month 20YY (same year)
  const singleYearMatch = str.match(/([a-z]+)\s*[-–—]\s*([a-z]+)\s*(\d{4})/i);
  if (singleYearMatch) {
    const m1 = formatMonth(singleYearMatch[1]);
    const m2 = formatMonth(singleYearMatch[2]);
    const y = singleYearMatch[3];
    return `${m1}–${m2} ${y}`;
  }

  // Pattern 3: Month 20YY (single month)
  const singleMonthMatch = str.match(/([a-z]+)\s*(\d{4})/i);
  if (singleMonthMatch) {
    const m = formatMonth(singleMonthMatch[1]);
    const y = singleMonthMatch[2];
    return `${m} ${y}`;
  }

  return null;
}

/**
 * Normalizes an array (or single item/string) of "Time and Room" selections.
 * @param {Array<string>|string} rawInput 
 * @returns {{ roomRequests: Array<{room: string, term: string|null, price: string|null}>, flexibilityNote: string|null, unrecognizedValues: Array<string> }}
 */
export function normalizeTimeAndRoom(rawInput) {
  let values = [];
  if (Array.isArray(rawInput)) {
    values = rawInput.map(v => (typeof v === 'string' ? v : v?.name || '')).filter(Boolean);
  } else if (typeof rawInput === 'string') {
    values = rawInput.split(',').map(s => s.trim()).filter(Boolean);
  }

  const roomRequests = [];
  const flexNotes = [];
  const unrecognizedValues = [];

  for (const rawVal of values) {
    let matchedCanonical = false;
    for (const canonical of CANONICAL_ROOMS) {
      if (canonical.pattern.test(rawVal)) {
        matchedCanonical = true;
        const term = extractTerm(rawVal);
        roomRequests.push({
          room: canonical.room,
          term: term,
          price: canonical.price
        });
        break;
      }
    }

    if (!matchedCanonical) {
      flexNotes.push(rawVal);
      unrecognizedValues.push(rawVal);
    }
  }

  return {
    roomRequests,
    flexibilityNote: flexNotes.length > 0 ? flexNotes.join(' / ') : null,
    unrecognizedValues
  };
}
