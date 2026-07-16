import { storage } from "./storage.js";

const GIPHY_SEARCH_URL = "https://api.giphy.com/v1/gifs/search";

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

  const url = new URL(GIPHY_SEARCH_URL);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", query);
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
