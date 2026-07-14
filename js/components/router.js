import { qsa, qs } from "../utils/dom.js";

const VIEW_IDS = ["dashboard", "research", "content", "meme", "history", "settings"];

/**
 * Wires up sidebar nav buttons and any [data-goto] shortcut buttons to
 * switch the visible view. Call once on startup.
 * @param {(viewName: string) => void} [onNavigate]
 */
export function initRouter(onNavigate) {
  qsa(".nav-item[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => goTo(btn.dataset.view, onNavigate));
  });
  qsa("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => goTo(btn.dataset.goto, onNavigate));
  });
}

/** @param {string} viewName @param {(viewName: string) => void} [onNavigate] */
export function goTo(viewName, onNavigate) {
  if (!VIEW_IDS.includes(viewName)) return;
  qsa(".view").forEach((v) => v.classList.remove("is-active"));
  qs(`#view-${viewName}`)?.classList.add("is-active");
  qsa(".nav-item[data-view]").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.view === viewName)
  );
  if (onNavigate) onNavigate(viewName);
}
