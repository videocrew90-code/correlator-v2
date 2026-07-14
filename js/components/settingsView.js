import { qs } from "../utils/dom.js";
import { storage } from "../services/storage.js";
import { showToast } from "./toast.js";

/** @param {{onHistoryCleared:()=>void}} handlers */
export function initSettings({ onHistoryCleared }) {
  const keyInput = qs("#api-key-input");
  keyInput.value = storage.getApiKey();

  qs("#save-key-btn").addEventListener("click", () => {
    const value = keyInput.value.trim();
    if (!value) {
      showToast("Enter a key first", "error");
      return;
    }
    storage.setApiKey(value);
    showToast("Key saved");
  });

  qs("#clear-key-btn").addEventListener("click", () => {
    storage.clearApiKey();
    keyInput.value = "";
    showToast("Key removed");
  });

  qs("#clear-history-btn").addEventListener("click", () => {
    if (!confirm("Clear all saved analyses? This can't be undone.")) return;
    storage.clearHistory();
    onHistoryCleared();
    showToast("History cleared");
  });
}
