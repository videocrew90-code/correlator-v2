/**
 * Hacker News search via the Algolia HN API. This one is genuinely
 * CORS-friendly and needs no key, which makes it the most reliable
 * evidence source in this app.
 */
export async function searchHackerNews(query, limit = 8) {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HN ${res.status}`);
    const data = await res.json();
    const hits = data?.hits || [];

    return hits.map((h) => ({
      source: "hackernews",
      title: h.title || h.story_title || "(untitled)",
      snippet: "",
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      points: h.points || 0,
      comments: h.num_comments || 0,
      createdAt: h.created_at,
      rawScore: (h.points || 0) + (h.num_comments || 0) * 2,
    }));
  } catch (err) {
    console.warn(`HN search failed for "${query}":`, err.message);
    return [];
  }
}
