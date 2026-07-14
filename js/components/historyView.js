import { qs, clear, el } from "../utils/dom.js";
import { relativeTime, truncate } from "../utils/format.js";
import { storage } from "../services/storage.js";

/**
 * @param {Array} history
 * @param {{onOpen:(record:object)=>void, onDeleted:(history:Array)=>void}} handlers
 */
export function renderHistory(history, { onOpen, onDeleted }) {
  const container = qs("#history-list");
  clear(container);

  if (history.length === 0) {
    container.appendChild(
      el("div", { class: "empty-state" }, [
        el("h3", {}, ["No history yet"]),
        el("p", {}, ["Analyses you run will be saved here automatically."]),
      ])
    );
    return;
  }

  for (const record of history) {
    container.appendChild(
      el(
        "div",
        {
          class: "panel panel--tight",
          style: "display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:10px;",
        },
        [
          el("div", { style: "cursor:pointer; flex:1;", onClick: () => onOpen(record) }, [
            el("div", { style: "font-size:var(--fs-sm); color:var(--text-hi); margin-bottom:4px;" }, [
              truncate(record.postText, 110),
            ]),
            el("div", { class: "mono", style: "font-size:11px; color:var(--text-faint);" }, [
              `${relativeTime(record.createdAt)} · ${record.evidenceStats?.count || 0} sources · ${
                record.meme?.fits ? "meme matched" : "no meme"
              }`,
            ]),
          ]),
          el("button", { class: "btn btn--icon btn--sm", onClick: () => onDeleted(storage.deleteAnalysis(record.id)) }, [
            "✕",
          ]),
        ]
      )
    );
  }
}

/** @param {Array} history @param {string} query */
export function filterHistory(history, query) {
  if (!query.trim()) return history;
  const q = query.toLowerCase();
  return history.filter(
    (h) => h.postText.toLowerCase().includes(q) || (h.understanding?.topic || "").toLowerCase().includes(q)
  );
}
