/**
 * Builds the prompt for the first Gemini call: understand the pasted post
 * and produce keywords/search queries we can hand to Reddit + HN.
 * Kept separate from the meme + rewrite prompts so each call stays focused
 * and the JSON schema each one returns stays small and reliable.
 */
export function buildUnderstandPrompt(postText) {
  return `You are analysing a social media post for a content research tool.

POST:
"""
${postText}
"""

Return ONLY valid JSON (no markdown fences, no commentary) matching this shape:
{
  "topic": string,               // short topic label, 3-6 words
  "intent": string,               // what the author is trying to do (inform, persuade, vent, joke, sell, warn...)
  "emotion": string,              // dominant emotion (e.g. frustration, excitement, curiosity, outrage, humor)
  "audience": string,             // who this is written for
  "keywords": string[],           // 5-8 concrete keywords/phrases
  "searchQueries": string[]       // 3-5 short search-engine-style queries (2-6 words each) to find related discussion elsewhere
}`;
}

/**
 * Builds the prompt for the second Gemini call: given the original post and
 * the evidence gathered from Reddit/HN, produce the evidence-backed rewrite
 * plus a few alternate angles. This is intentionally scoped down from every
 * possible content format — depth over breadth.
 */
export function buildContentPrompt(postText, understanding, evidenceList) {
  const evidenceBlock = evidenceList
    .slice(0, 12)
    .map(
      (e, i) =>
        `[${i + 1}] (${e.source}, score ${e.score}) ${e.title}${e.snippet ? " — " + e.snippet : ""}`
    )
    .join("\n");

  return `You are a content strategist. A user is about to post the following, and we found related discussion already happening online. Use that evidence to write a sharper, better-grounded version — don't just paraphrase the original.

ORIGINAL POST:
"""
${postText}
"""

ANALYSIS: topic="${understanding.topic}", intent="${understanding.intent}", emotion="${understanding.emotion}", audience="${understanding.audience}"

EVIDENCE FOUND ELSEWHERE ON THE INTERNET:
${evidenceBlock || "(no strong evidence found — say so honestly in evidenceSummary and rely on general knowledge)"}

Return ONLY valid JSON (no markdown fences, no commentary) matching this shape:
{
  "evidenceSummary": string,        // 2-4 sentences: is this idea already spreading? where? how novel is it?
  "noveltyScore": number,           // 0-100, higher = more original vs. what's already out there
  "confidenceScore": number,        // 0-100, how confident this analysis is given the evidence found
  "rewrite": string,                // the main evidence-backed rewritten post, same platform/length feel as the original
  "alternateAngles": [
    { "label": string, "text": string }   // 2-3 alternates: e.g. "Contrarian take", "Beginner-friendly", "Data-led"
  ],
  "hooks": string[],                // 3 short opening-line hooks
  "hashtags": string[],             // up to 6 relevant hashtags, no # symbol
  "postingRecommendation": string   // one short sentence on timing/platform fit
}`;
}

/**
 * Builds the prompt for the meme-matching call. Templates are pre-fetched
 * from Imgflip so Gemini is choosing from a real, current template list
 * rather than hallucinating one.
 */
export function buildMemePrompt(postText, understanding, templates) {
  const templateList = templates
    .map((t) => `- id:${t.id} | "${t.name}" | boxes:${t.box_count}`)
    .join("\n");

  return `You are picking a meme template to accompany a social post. Be picky — only choose a template if the format genuinely fits the emotion and topic. If nothing fits well, say so.

POST:
"""
${postText}
"""
Topic: ${understanding.topic}. Emotion: ${understanding.emotion}. Intent: ${understanding.intent}.

AVAILABLE TEMPLATES (id | name | number of text boxes):
${templateList}

Return ONLY valid JSON (no markdown fences, no commentary) matching this shape:
{
  "fits": boolean,                 // false if nothing in the list genuinely fits
  "templateId": string | null,     // the chosen template's id, or null if fits=false
  "reason": string,                // one sentence on why this template matches the emotion/topic (or why nothing fit)
  "captions": string[]             // caption text for each text box of the chosen template, top to bottom (empty array if fits=false)
}`;
}
