import { callGeminiJSON } from "../services/gemini.js";
import { buildUnderstandPrompt, buildContentPrompt } from "../../prompts/analyzePrompt.js";
import { gatherEvidence, summarizeEvidence } from "./evidence.js";
import { matchMeme } from "./memeEngine.js";
import { storage } from "../services/storage.js";

/**
 * Runs the full Correlator pipeline for a pasted post:
 * understand -> search evidence -> rank -> generate content -> match meme.
 * Each stage reports progress via onProgress so the UI can show what's
 * happening instead of a single opaque spinner.
 *
 * @param {string} postText
 * @param {(stage: string) => void} onProgress
 * @returns {Promise<object>} the full analysis record (also saved to history)
 */
export async function runAnalysis(postText, onProgress = () => {}) {
  onProgress("Reading the post…");
  const understanding = await callGeminiJSON(buildUnderstandPrompt(postText));

  onProgress("Searching Reddit and Hacker News…");
  const evidence = await gatherEvidence(understanding.searchQueries || [understanding.topic]);
  const evidenceStats = summarizeEvidence(evidence);

  onProgress("Writing the evidence-backed rewrite…");
  const content = await callGeminiJSON(buildContentPrompt(postText, understanding, evidence));

  onProgress("Looking for a matching meme…");
  const meme = await matchMeme(postText, understanding);

  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    postText,
    understanding,
    evidence,
    evidenceStats,
    content,
    meme,
  };

  storage.saveAnalysis(record);
  onProgress("Done.");
  return record;
}
