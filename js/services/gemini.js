import { storage } from "./storage.js";

const MODEL = "gemini-2.0-flash";
const ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;

export class GeminiError extends Error {}

/**
 * Sends a single prompt to Gemini and parses the response as JSON.
 * Every call in this app asks Gemini for structured JSON, so parsing
 * (including stripping stray markdown fences) lives here once.
 * @param {string} prompt
 * @returns {Promise<any>}
 */
export async function callGeminiJSON(prompt) {
  const key = storage.getApiKey();
  if (!key) {
    throw new GeminiError("No Gemini API key set. Add one in Settings.");
  }

  const res = await fetch(ENDPOINT(key), {
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

/** Strips markdown code fences if the model added them despite instructions, then parses. */
function parseJsonLoose(text) {
  const cleaned = text.trim().replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new GeminiError("Gemini's response wasn't valid JSON. Try running the analysis again.");
  }
}
