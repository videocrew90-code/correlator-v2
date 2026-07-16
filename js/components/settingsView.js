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

  const giphyKeyInput = qs("#giphy-key-input");
  giphyKeyInput.value = storage.getGiphyKey();
  qs("#save-giphy-key-btn").addEventListener("click", () => {
    const value = giphyKeyInput.value.trim();
    if (!value) {
      showToast("Enter a key first", "error");
      return;
    }
    storage.setGiphyKey(value);
    showToast("Giphy key saved");
  });
  qs("#clear-giphy-key-btn").addEventListener("click", () => {
    storage.clearGiphyKey();
    giphyKeyInput.value = "";
    showToast("Giphy key removed");
  });

  qs("#clear-history-btn").addEventListener("click", () => {
    if (!confirm("Clear all saved analyses? This can't be undone.")) return;
    storage.clearHistory();
    onHistoryCleared();
    showToast("History cleared");
  });
}
