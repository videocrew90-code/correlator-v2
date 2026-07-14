/**
 * Reddit's public search endpoint. No API key needed, but note: Reddit does
 * not reliably send CORS headers on every deployment/network path, so a
 * request can fail in-browser even though the same URL works when fetched
 * server-side. We fail soft here — one dead source should never break the
 * whole pipeline, it just means less evidence from this source.
 */
export async function searchReddit(query, limit = 8) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=${limit}`;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Reddit ${res.status}`);
    const data = await res.json();
    const posts = data?.data?.children || [];

    return posts.map((p) => {
      const d = p.data;
      return {
        source: "reddit",
        title: d.title,
        snippet: (d.selftext || "").slice(0, 200),
        url: `https://reddit.com${d.permalink}`,
        subreddit: d.subreddit_name_prefixed,
        upvotes: d.ups,
        comments: d.num_comments,
        createdAt: new Date(d.created_utc * 1000).toISOString(),
        // Simple normalized signal used later for ranking.
        rawScore: d.ups + d.num_comments * 2,
      };
    });
  } catch (err) {
    console.warn(`Reddit search failed for "${query}":`, err.message);
    return [];
  }
}
