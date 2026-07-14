import { storage } from "./services/storage.js";
import { runAnalysis } from "./core/pipeline.js";
import { initRouter, goTo } from "./components/router.js";
import { showToast } from "./components/toast.js";
import { renderDashboard } from "./components/dashboardView.js";
import { renderResearchResults } from "./components/researchView.js";
import { renderContent } from "./components/contentView.js";
import { renderMeme } from "./components/memeView.js";
import { renderHistory, filterHistory } from "./components/historyView.js";
import { initSettings } from "./components/settingsView.js";
import { qs } from "./utils/dom.js";

/** Re-renders every view that depends on saved history (Dashboard + History). */
function refreshHistoryViews() {
  const history = storage.getHistory();
  renderDashboard(history);
  renderHistory(history, { onOpen: openRecord, onDeleted: refreshHistoryViews });
}

/** Opens a past (or just-created) analysis across Research/Content/Meme views. */
function openRecord(record) {
  renderResearchResults(record);
  renderContent(record);
  renderMeme(record);
  goTo("research");
}

async function handleAnalyze() {
  const textarea = qs("#post-input");
  const statusEl = qs("#analyze-status");
  const btn = qs("#analyze-btn");
  const postText = textarea.value.trim();

  if (!postText) {
    showToast("Paste a post first", "error");
    return;
  }
  if (!storage.getApiKey()) {
    showToast("Add your Gemini API key in Settings first", "error");
    goTo("settings");
    return;
  }

  btn.disabled = true;
  try {
    const record = await runAnalysis(postText, (stage) => {
      statusEl.textContent = stage;
    });
    renderResearchResults(record);
    renderContent(record);
    renderMeme(record);
    refreshHistoryViews();
    showToast("Analysis complete");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "";
    showToast(err.message || "Something went wrong", "error");
  } finally {
    btn.disabled = false;
  }
}

function init() {
  initRouter();
  initSettings({ onHistoryCleared: refreshHistoryViews });
  qs("#analyze-btn").addEventListener("click", handleAnalyze);
  qs("#history-search").addEventListener("input", (e) => {
    renderHistory(filterHistory(storage.getHistory(), e.target.value), {
      onOpen: openRecord,
      onDeleted: refreshHistoryViews,
    });
  });

  refreshHistoryViews();
}

init();
