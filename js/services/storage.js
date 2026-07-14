/**
 * Thin wrapper around localStorage. Keeps key names in one place and
 * guards against JSON parse failures / private-browsing quota errors.
 */

const KEYS = {
  apiKey: "correlator:gemini-key",
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

  deleteAnalysis(id) {
    const history = storage.getHistory().filter((h) => h.id !== id);
    localStorage.setItem(KEYS.history, JSON.stringify(history));
    return history;
  },

  clearHistory() {
    localStorage.removeItem(KEYS.history);
  },
};
