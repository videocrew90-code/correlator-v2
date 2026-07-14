import { qs, clear, el } from "../utils/dom.js";
import { shortHost, relativeTime } from "../utils/format.js";

/** @param {object} record a full analysis record from the pipeline */
export function renderResearchResults(record) {
  const container = qs("#research-results");
  clear(container);

  const { understanding, evidence } = record;

  const summary = el("div", { class: "panel", style: "margin-bottom:20px;" }, [
    el("div", { style: "display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;" }, [
      el("span", { class: "badge badge--amber" }, [`Topic: ${understanding.topic}`]),
      el("span", { class: "badge" }, [`Intent: ${understanding.intent}`]),
      el("span", { class: "badge" }, [`Emotion: ${understanding.emotion}`]),
    ]),
    el("p", { style: "color:var(--text-mid); font-size:var(--fs-sm);" }, [
      record.content?.evidenceSummary || "",
    ]),
  ]);
  container.appendChild(summary);

  if (evidence.length === 0) {
    container.appendChild(
      el("div", { class: "empty-state" }, [
        el("h3", {}, ["No related discussion found"]),
        el("p", {}, [
          "That doesn't guarantee the idea is original — sources here are limited to Reddit and Hacker News — but nothing matched closely.",
        ]),
      ])
    );
    return;
  }

  const board = el("div", { class: "thread-board" });
  evidence.forEach((item, i) => {
    const node = el(
      "a",
      {
        class: "thread-node",
        href: item.url,
        target: "_blank",
        rel: "noopener",
        style: `text-decoration:none; animation-delay:${i * 40}ms;`,
      },
      [
        el("div", { style: "flex:1;" }, [
          el("div", { class: "thread-node__source" }, [
            item.source === "reddit" ? item.subreddit || "reddit" : "hacker news",
          ]),
          el("div", { class: "thread-node__title" }, [item.title]),
          el("div", { class: "thread-node__meta" }, [
            el("span", {}, [shortHost(item.url)]),
            el("span", {}, [relativeTime(item.createdAt)]),
          ]),
        ]),
        el("span", { class: "thread-node__relevance mono" }, [`${item.score}`]),
      ]
    );
    board.appendChild(node);
  });
  container.appendChild(board);
}
