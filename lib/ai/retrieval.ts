import { dayKey } from '../dates';
import { triggerLabel } from '../triggers';
import type { AppState } from '../types';

export interface JournalHit {
  source: 'urge' | 'check_in' | 'reason';
  when: string | null;
  text: string;
  context?: string;
  score: number;
}

const AR_STOPWORDS = new Set([
  'من', 'في', 'على', 'الى', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي',
  'ان', 'أن', 'إن', 'كان', 'كانت', 'لا', 'ما', 'هو', 'هي', 'انا', 'أنا', 'و',
]);
const EN_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'of', 'to', 'in', 'on', 'at', 'for', 'with', 'my', 'i', 'me', 'it', 'that', 'this',
]);

/** Strips Arabic diacritics and normalizes letter variants so search matches how people actually type. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ');
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 1 && !AR_STOPWORDS.has(w) && !EN_STOPWORDS.has(w));
}

/**
 * Deliberately a lexical search, not embeddings: the corpus is one person's
 * own notes (tens to hundreds of short entries), it must work fully offline,
 * and shipping an embedding model to a phone for this would cost far more
 * than it returns.
 */
function score(queryTokens: string[], text: string, ageDays: number): number {
  if (queryTokens.length === 0) return 0;
  const docTokens = tokenize(text);
  if (docTokens.length === 0) return 0;
  const docSet = new Set(docTokens);

  let overlap = 0;
  for (const q of queryTokens) {
    if (docSet.has(q)) overlap += 1;
    // Partial credit for stem-ish prefix matches ("lonely" vs "loneliness").
    else if (docTokens.some((d) => d.startsWith(q) || q.startsWith(d))) overlap += 0.5;
  }
  if (overlap === 0) return 0;

  const coverage = overlap / queryTokens.length;
  // Recent entries matter more in recovery — last month is fully weighted,
  // older material decays but never disappears.
  const recency = 1 / (1 + Math.max(0, ageDays) / 30);
  return coverage * (0.75 + 0.25 * recency);
}

export function searchJournal(state: AppState, query: string, limit = 5): JournalHit[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const now = Date.now();
  const hits: JournalHit[] = [];

  state.urges.forEach((u) => {
    const body = [u.feeling, u.why].filter(Boolean).join(' — ');
    if (!body) return;
    const ageDays = (now - u.startedAt) / 86400000;
    const s = score(queryTokens, body, ageDays);
    if (s > 0) {
      hits.push({
        source: 'urge',
        when: dayKey(u.startedAt),
        text: body,
        context: `outcome: ${u.outcome}${
          u.triggers?.length ? `, triggers: ${u.triggers.map((t) => triggerLabel(t, 'en')).join(', ')}` : ''
        }${u.intensity != null ? `, intensity: ${u.intensity}/10` : ''}`,
        score: s,
      });
    }
  });

  state.checkIns.forEach((c) => {
    if (!c.note) return;
    const ageDays = (now - c.at) / 86400000;
    const s = score(queryTokens, c.note, ageDays);
    if (s > 0) hits.push({ source: 'check_in', when: c.day, text: c.note, context: `mood: ${c.mood}`, score: s });
  });

  (state.habit?.reasons ?? []).forEach((reason) => {
    const s = score(queryTokens, reason, 0);
    if (s > 0) hits.push({ source: 'reason', when: null, text: reason, score: s });
  });

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
