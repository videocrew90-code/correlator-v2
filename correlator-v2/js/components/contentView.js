import { qs, clear, el } from "../utils/dom.js";
import { wordCount, readingTimeMinutes } from "../utils/format.js";
import { showToast } from "./toast.js";

/** @param {object} record a full analysis record from the pipeline */
export function renderContent(record) {
  const container = qs("#content-results");
  clear(container);

  const c = record.content;
  if (!c) return;

  const pieces = [
    { label: "Evidence-backed rewrite", text: c.rewrite },
    ...(c.alternateAngles || []).map((a) => ({ label: a.label, text: a.text })),
  ];

  for (const piece of pieces) {
    container.appendChild(buildContentCard(piece.label, piece.text));
  }

  const meta = el("div", { class: "panel", style: "margin-top:8px;" }, [
    el("h3", { style: "font-size:var(--fs-md); margin-bottom:10px;" }, ["Hooks & tags"]),
    el(
      "div",
      { style: "margin-bottom:12px;" },
      (c.hooks || []).map((h) =>
        el("div", { style: "font-size:var(--fs-sm); color:var(--text-mid); margin-bottom:6px;" }, [`"${h}"`])
      )
    ),
    el(
      "div",
      { style: "display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;" },
      (c.hashtags || []).map((h) => el("span", { class: "badge badge--thread" }, [`#${h}`]))
    ),
    el("p", { style: "font-size:var(--fs-xs); color:var(--text-faint);" }, [c.postingRecommendation || ""]),
  ]);
  container.appendChild(meta);
}

function buildContentCard(label, text) {
  const words = wordCount(text);
  return el("div", { class: "content-card" }, [
    el("div", { class: "content-card__head" }, [
      el("div", { class: "content-card__title" }, [label]),
      el("div", { class: "content-card__meta" }, [
        el("span", {}, [`${words}w`]),
        el("span", {}, [`${readingTimeMinutes(text)} min read`]),
        el("button", { class: "btn btn--icon btn--sm", onClick: () => copyToClipboard(text) }, ["Copy"]),
      ]),
    ]),
    el("div", { class: "content-card__body" }, [text]),
  ]);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    () => showToast("Copied to clipboard"),
    () => showToast("Couldn't copy — select and copy manually", "error")
  );
}
