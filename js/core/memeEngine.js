import { fetchMemeTemplates } from "../services/imgflip.js";
import { callGeminiJSON } from "../services/gemini.js";
import { buildMemePrompt } from "../../prompts/analyzePrompt.js";

/**
 * Runs the meme matching pipeline: analyse -> pick category -> pick template
 * -> generate captions. If nothing genuinely fits, returns fits:false rather
 * than forcing a template on the post.
 * @param {string} postText
 * @param {{topic:string, emotion:string, intent:string}} understanding
 */
export async function matchMeme(postText, understanding) {
  const templates = await fetchMemeTemplates();

  if (templates.length === 0) {
    return { fits: false, reason: "Meme template library is unavailable right now." };
  }

  // Give Gemini a manageable, varied slice rather than the full ~100 list.
  const candidates = pickCandidateSlice(templates, 40);

  const result = await callGeminiJSON(buildMemePrompt(postText, understanding, candidates));

  if (!result.fits || !result.templateId) {
    return { fits: false, reason: result.reason || "No suitable meme." };
  }

  const template = templates.find((t) => String(t.id) === String(result.templateId));
  if (!template) {
    return { fits: false, reason: "Gemini picked a template that no longer exists." };
  }

  return {
    fits: true,
    reason: result.reason,
    template,
    captions: result.captions || [],
  };
}

function pickCandidateSlice(templates, n) {
  if (templates.length <= n) return templates;
  // Deterministic spread across the popularity-ordered list rather than just top-N,
  // so niche-but-fitting formats (reaction/comparison templates lower in the list)
  // still get a chance to be picked.
  const step = Math.floor(templates.length / n);
  const slice = [];
  for (let i = 0; i < templates.length && slice.length < n; i += step) {
    slice.push(templates[i]);
  }
  return slice;
}
