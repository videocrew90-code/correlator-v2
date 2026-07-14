import { qs, clear, el } from "../utils/dom.js";
import { relativeTime, truncate } from "../utils/format.js";

/** @param {Array} history */
export function renderDashboard(history) {
  renderStats(history);
  renderRecent(history);
}

function renderStats(history) {
  const container = qs("#dashboard-stats");
  clear(container);

  const total = history.length;
  const avgScore = total
    ? Math.round(history.reduce((s, h) => s + (h.evidenceStats?.avgScore || 0), 0) / total)
    : 0;
  const memeHitRate = total
    ? Math.round((history.filter((h) => h.meme?.fits).length / total) * 100)
    : 0;
  const totalEvidence = history.reduce((s, h) => s + (h.evidenceStats?.count || 0), 0);

  const cards = [
    { label: "Analyses run", value: total, cls: "" },
    { label: "Avg evidence score", value: `${avgScore}`, cls: "accent-thread" },
    { label: "Meme match rate", value: `${memeHitRate}%`, cls: "accent-amber" },
    { label: "Sources checked", value: totalEvidence, cls: "" },
  ];

  for (const c of cards) {
    container.appendChild(
      el("div", { class: "stat-card" }, [
        el("div", { class: "stat-card__label" }, [c.label]),
        el("div", { class: `stat-card__value ${c.cls}` }, [String(c.value)]),
      ])
    );
  }
}

function renderRecent(history) {
  const container = qs("#dashboard-recent");
  clear(container);

  if (history.length === 0) {
    container.appendChild(
      el("div", { class: "empty-state" }, [
        el("h3", {}, ["No analyses yet"]),
        el("p", {}, ["Paste a post in Research to run your first correlation."]),
      ])
    );
    return;
  }

  for (const record of history.slice(0, 6)) {
    container.appendChild(
      el(
        "div",
        {
          style:
            "padding:12px 0; border-bottom:1px solid var(--ink-border-soft); display:flex; justify-content:space-between; gap:16px;",
        },
        [
          el("div", {}, [
            el("div", { style: "font-size:var(--fs-sm); color:var(--text-hi);" }, [
              truncate(record.postText, 90),
            ]),
            el("div", { class: "mono", style: "font-size:11px; color:var(--text-faint); margin-top:4px;" }, [
              relativeTime(record.createdAt),
            ]),
          ]),
          el("span", { class: "badge badge--thread" }, [`${record.evidenceStats?.count || 0} sources`]),
        ]
      )
    );
  }
}
