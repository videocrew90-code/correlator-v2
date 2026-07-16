import { fetchMemeTemplates } from "../services/imgflip.js";
import { callGeminiJSON } from "../services/gemini.js";
import { buildMemePrompt } from "../../prompts/analyzePrompt.js";

/**
 * Runs the meme matching pipeline: analyse -> pick category -> pick template
 * -> generate captions. If nothing genuinely fits, returns fits:false rather
 * than forcing a template on the post.
 * @param {string} postText
 * @param {{topic:string, emotion:string, intent:string}} understanding
 * @param {{excludeTemplateIds?: string[]}} [options] - template ids to leave
 *   out of consideration, e.g. ones already shown for this post.
 */
export async function matchMeme(postText, understanding, options = {}) {
  const { excludeTemplateIds = [] } = options;
  const templates = await fetchMemeTemplates();
  if (templates.length === 0) {
    return { fits: false, reason: "Meme template library is unavailable right now." };
  }

  const pool = excludeTemplateIds.length
    ? templates.filter((t) => !excludeTemplateIds.includes(String(t.id)))
    : templates;
  // If excluding wipes out the whole library (small template set), fall
  // back to the full list rather than returning "no meme fits".
  const usablePool = pool.length > 0 ? pool : templates;

  // Give Gemini a manageable, varied slice rather than the full ~100 list.
  const candidates = pickCandidateSlice(usablePool, 40);
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
  // Random sample rather than a deterministic walk, so repeated calls
  // (including Regenerate) actually see a different slice of the library.
  const shuffled = shuffle([...templates]);
  return shuffled.slice(0, n);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
