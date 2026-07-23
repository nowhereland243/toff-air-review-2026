export interface ScoreRecord {
  artist: string;
  slug: string;
  artisticMerit: number;
  proposal: number;
  mission: number;
  readiness: number;
  comments: string;
  updatedAt: number;
}

const SCORE_PREFIX = 'score_data_';
const LAST_SUBMIT_KEY = 'toff_last_bulk_submit';
const EVENT_NAME = 'toff_score_updated';

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
const autoSaveQueue = new Map<string, ScoreRecord>();

/**
 * Save a score for a specific artist.
 */
export function saveScore(slug: string, artistName: string, record: Partial<ScoreRecord>) {
  if (typeof window === 'undefined') return;
  const existing = getScore(slug);
  const updated: ScoreRecord = {
    artist: artistName,
    slug,
    artisticMerit: record.artisticMerit ?? existing?.artisticMerit ?? 0,
    proposal: record.proposal ?? existing?.proposal ?? 0,
    mission: record.mission ?? existing?.mission ?? 0,
    readiness: record.readiness ?? existing?.readiness ?? 0,
    comments: record.comments ?? existing?.comments ?? '',
    updatedAt: Date.now(),
  };
  localStorage.setItem(`${SCORE_PREFIX}${slug}`, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));

  queueAutoSave(updated);
}

function queueAutoSave(record: ScoreRecord) {
  autoSaveQueue.set(record.slug, record);
  window.dispatchEvent(new CustomEvent('toff_autosave_status', { detail: { status: 'saving' } }));

  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    const judge = getJudgeName();
    const webhookUrl = process.env.NEXT_PUBLIC_SCORE_WEBHOOK_URL;
    if (!judge || !webhookUrl || autoSaveQueue.size === 0) {
      window.dispatchEvent(new CustomEvent('toff_autosave_status', { detail: { status: 'idle' } }));
      return;
    }

    const recordsToSync = Array.from(autoSaveQueue.values());
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ judge, records: recordsToSync }),
      });
      if (res.ok) {
        autoSaveQueue.clear();
        markAsSubmitted();
        window.dispatchEvent(new CustomEvent('toff_autosave_status', { detail: { status: 'saved' } }));
      } else {
        window.dispatchEvent(new CustomEvent('toff_autosave_status', { detail: { status: 'error' } }));
      }
    } catch (e) {
      window.dispatchEvent(new CustomEvent('toff_autosave_status', { detail: { status: 'error' } }));
    }
  }, 1000);
}

/**
 * Get the score for a specific artist.
 */
export function getScore(slug: string): ScoreRecord | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(`${SCORE_PREFIX}${slug}`);
  if (!data) return null;
  try {
    return JSON.parse(data) as ScoreRecord;
  } catch {
    return null;
  }
}

/**
 * Get all scores currently in localStorage.
 */
export function getAllScores(): ScoreRecord[] {
  if (typeof window === 'undefined') return [];
  const scores: ScoreRecord[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(SCORE_PREFIX)) {
      try {
        const record = JSON.parse(localStorage.getItem(key)!) as ScoreRecord;
        scores.push(record);
      } catch (e) {
        // ignore invalid JSON
      }
    }
  }
  return scores.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Check how many scores are new or edited since the last bulk submit.
 */
export function getPendingChangesCount(): number {
  if (typeof window === 'undefined') return 0;
  const lastSubmitStr = localStorage.getItem(LAST_SUBMIT_KEY);
  const lastSubmit = lastSubmitStr ? parseInt(lastSubmitStr, 10) : 0;
  const allScores = getAllScores();
  return allScores.filter(s => s.updatedAt > lastSubmit).length;
}

/**
 * Mark all current scores as submitted.
 */
export function markAsSubmitted() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SUBMIT_KEY, Date.now().toString());
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function getJudgeName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('judge_name') || '';
}

export function setJudgeName(name: string) {
  if (typeof window === 'undefined') return;
  const trimmed = name.trim();
  localStorage.setItem('judge_name', trimmed);
  if (trimmed) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('judge', trimmed);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      // ignore SSR URL parsing errors
    }
  }
  window.dispatchEvent(new Event(EVENT_NAME));
  if (trimmed) {
    syncScoresFromRemote(trimmed);
  }
}

/**
 * Sync scores from remote Google Sheet for the current judge.
 */
export async function syncScoresFromRemote(judgeName?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const targetJudge = judgeName || getJudgeName();
  if (!targetJudge) return false;

  const webhookUrl = process.env.NEXT_PUBLIC_SCORE_WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const url = `${webhookUrl}?judge=${encodeURIComponent(targetJudge)}`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.records)) {
      let updatedAny = false;
      for (const rec of data.records as ScoreRecord[]) {
        if (!rec.slug) continue;
        const local = getScore(rec.slug);
        // If local doesn't exist or remote timestamp is newer/equal
        if (!local || rec.updatedAt >= local.updatedAt) {
          localStorage.setItem(`${SCORE_PREFIX}${rec.slug}`, JSON.stringify(rec));
          updatedAny = true;
        }
      }
      if (updatedAny) {
        window.dispatchEvent(new Event(EVENT_NAME));
      }
      return true;
    }
  } catch (e) {
    console.error('Failed to sync scores from remote:', e);
  }
  return false;
}

/**
 * Compute composite score (average of the 4 criteria)
 */
export function getCompositeScore(score: ScoreRecord): number {
  let total = 0;
  let count = 0;
  if (score.artisticMerit > 0) { total += score.artisticMerit; count++; }
  if (score.proposal > 0) { total += score.proposal; count++; }
  if (score.mission > 0) { total += score.mission; count++; }
  if (score.readiness > 0) { total += score.readiness; count++; }
  if (count === 0) return 0;
  return total / count;
}
