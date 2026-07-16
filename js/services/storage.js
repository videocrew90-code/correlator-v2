/**
 * Thin wrapper around localStorage. Keeps key names in one place and
 * guards against JSON parse failures / private-browsing quota errors.
 */
const KEYS = {
  apiKey: "correlator:gemini-key",
  giphyKey: "correlator:giphy-key",
  history: "correlator:history",
};
export const storage = {
  getApiKey() {
    return localStorage.getItem(KEYS.apiKey) || "";
  },
  setApiKey(key) {
    localStorage.setItem(KEYS.apiKey, key.trim());
  },
  clearApiKey() {
    localStorage.removeItem(KEYS.apiKey);
  },
  getGiphyKey() {
    return localStorage.getItem(KEYS.giphyKey) || "";
  },
  setGiphyKey(key) {
    localStorage.setItem(KEYS.giphyKey, key.trim());
  },
  clearGiphyKey() {
    localStorage.removeItem(KEYS.giphyKey);
  },
  getHistory() {
    try {
      const raw = localStorage.getItem(KEYS.history);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveAnalysis(record) {
    const history = storage.getHistory();
    history.unshift(record);
    // Keep the most recent 100 to avoid blowing the localStorage quota.
    const trimmed = history.slice(0, 100);
    try {
      localStorage.setItem(KEYS.history, JSON.stringify(trimmed));
    } catch (err) {
      console.warn("Could not persist history (quota?):", err);
    }
    return trimmed;
  },
  // Updates an existing record in place (by id) instead of prepending a new
  // one. Used when a record is mutated after creation, e.g. regenerating
  // a meme or re-running a GIF search.
  updateAnalysis(record) {
    const history = storage.getHistory();
    const idx = history.findIndex((h) => h.id === record.id);
    if (idx !== -1) {
      history[idx] = record;
    } else {
      history.unshift(record);
    }
    try {
      localStorage.setItem(KEYS.history, JSON.stringify(history));
    } catch (err) {
      console.warn("Could not persist updated analysis (quota?):", err);
    }
    return history;
  },
  deleteAnalysis(id) {
    const history = storage.getHistory().filter((h) => h.id !== id);
    localStorage.setItem(KEYS.history, JSON.stringify(history));
    return history;
  },
  clearHistory() {
    localStorage.removeItem(KEYS.history);
  },
};
