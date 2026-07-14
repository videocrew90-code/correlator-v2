import { searchReddit } from "../services/reddit.js";
import { searchHackerNews } from "../services/hackernews.js";

/**
 * Runs every search query against every source in parallel, then merges,
 * dedupes, and ranks the results into a single evidence list.
 * @param {string[]} queries
 * @returns {Promise<Array>}
 */
export async function gatherEvidence(queries) {
  const searchTasks = queries.flatMap((q) => [searchReddit(q), searchHackerNews(q)]);
  const results = await Promise.all(searchTasks);
  const flat = results.flat();

  const deduped = dedupeByUrl(flat);
  const scored = deduped.map((item) => ({ ...item, score: normalizeScore(item, deduped) }));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 20);
}

function dedupeByUrl(items) {
  const seen = new Map();
  for (const item of items) {
    const key = item.url;
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
}

/** Normalizes each item's raw engagement signal to a 0-100 score relative to the batch. */
function normalizeScore(item, all) {
  const max = Math.max(1, ...all.map((i) => i.rawScore || 0));
  return Math.round(((item.rawScore || 0) / max) * 100);
}

/** Aggregate stats used by the Analytics summary and dashboard cards. */
export function summarizeEvidence(evidenceList) {
  const bySource = {};
  for (const item of evidenceList) {
    bySource[item.source] = (bySource[item.source] || 0) + 1;
  }
  const avgScore = evidenceList.length
    ? Math.round(evidenceList.reduce((sum, i) => sum + i.score, 0) / evidenceList.length)
    : 0;

  return { count: evidenceList.length, bySource, avgScore };
}
