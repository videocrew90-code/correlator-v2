/**
 * Imgflip's get_memes endpoint returns their current top ~100 templates
 * publicly, no key required. We use this as the candidate list that Gemini
 * picks from — captions are rendered client-side (see core/memeEngine.js)
 * rather than through Imgflip's captioning API, which requires a separate
 * username/password and would break the "one key" promise.
 */

let cachedTemplates = null;

export async function fetchMemeTemplates() {
  if (cachedTemplates) return cachedTemplates;

  try {
    const res = await fetch("https://api.imgflip.com/get_memes");
    if (!res.ok) throw new Error(`Imgflip ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("Imgflip returned success=false");

    cachedTemplates = data.data.memes.map((m) => ({
      id: m.id,
      name: m.name,
      url: m.url,
      width: m.width,
      height: m.height,
      box_count: m.box_count,
    }));
    return cachedTemplates;
  } catch (err) {
    console.warn("Could not load meme templates:", err.message);
    return [];
  }
}
