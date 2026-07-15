import { storage } from "./storage.js";

const MODEL_FALLBACK_CHAIN = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
];

const ENDPOINT = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

export class GeminiError extends Error {}

/**
 * Sends a single prompt to Gemini and parses the response as JSON.
 * Every call in this app asks Gemini for structured JSON, so parsing
 * (including stripping stray markdown fences) lives here once.
 * Tries each model in MODEL_FALLBACK_CHAIN in order, falling back to
 * the next one if a model is rate-limited (429) or unavailable (404).
 * @param {string} prompt
 * @returns {Promise<any>}
 */
export async function callGeminiJSON(prompt) {
  const key = storage.getApiKey();
  if (!key) {
    throw new GeminiError("No Gemini API key set. Add one in Settings.");
  }

  let lastErrorMessage = "";

  for (const model of MODEL_FALLBACK_CHAIN) {
    const res = await fetch(ENDPOINT(model, key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    if (res.status === 429 || res.status === 404) {
      // quota hit or model unavailable — try the next model in the chain
      const body = await res.text().catch(() => "");
      lastErrorMessage = `${model} (${res.status}): ${body.slice(0, 200)}`;
      console.warn(`Gemini fallback: ${lastErrorMessage}`);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new GeminiError(`Gemini request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    if (!text) {
      const blockReason = data?.promptFeedback?.blockReason;
      throw new GeminiError(blockReason ? `Gemini blocked the request: ${blockReason}` : "Gemini returned an empty response.");
    }

    return parseJsonLoose(text);
  }

  // every model in the chain failed
  throw new GeminiError(`All Gemini models exhausted or rate-limited. Last error: ${lastErrorMessage}`);
}

/** Strips markdown code fences if the model added them despite instructions, then parses. */
function parseJsonLoose(text) {
  const cleaned = text.trim().replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new GeminiError("Gemini's response wasn't valid JSON. Try running the analysis again.");
  }
}
