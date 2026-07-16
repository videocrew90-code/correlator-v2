import { storage } from "./storage.js";

const GIPHY_SEARCH_URL = "https://api.giphy.com/v1/gifs/search";
// Giphy's search endpoint rejects long query strings (observed limit
// around 50 chars, returning a 414 "Query Too Long"). Truncate on a
// word boundary so we never send more than this.
const MAX_QUERY_LENGTH = 50;

function clampQuery(query) {
  if (query.length <= MAX_QUERY_LENGTH) return query;
  const truncated = query.slice(0, MAX_QUERY_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim();
}

/**
 * Searches Giphy for GIFs matching a query.
 * @param {string} query
 * @param {number} [limit]
 * @param {number} [offset]
 * @returns {Promise<{needsKey?: boolean, gifs: Array, error?: string}>}
 */
export async function searchGifs(query, limit = 8, offset = 0) {
  const apiKey = storage.getGiphyKey();
  if (!apiKey) {
    return { needsKey: true, gifs: [] };
  }

  const safeQuery = clampQuery(query.trim());

  const url = new URL(GIPHY_SEARCH_URL);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", safeQuery);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("rating", "pg-13");

  let res;
  try {
    res = await fetch(url.toString());
  } catch {
    return { gifs: [], error: "Network error reaching Giphy." };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return { gifs: [], error: "Giphy rejected the API key." };
    }
    if (res.status === 414) {
      return { gifs: [], error: "Search term too long for Giphy — try something shorter." };
    }
    return { gifs: [], error: `Giphy returned ${res.status}.` };
  }

  const data = await res.json();
  const gifs = (data.data || []).map((g) => ({
    id: g.id,
    title: g.title,
    url: g.images?.original?.url,
    previewUrl: g.images?.fixed_width_small?.url || g.images?.fixed_width?.url,
    pageUrl: g.url,
  }));
  return { gifs };
}
