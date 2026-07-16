import { qs, clear, el } from "../utils/dom.js";
import { regenerateMeme } from "../core/pipeline.js";
import { searchGifs } from "../services/gifs.js";
import { storage } from "../services/storage.js";
import { showToast } from "./toast.js";

// The record currently shown in the Meme view. Regenerate/search handlers
// close over this instead of the record passed at render time, so they
// always act on the latest state (e.g. after a regenerate updates it).
let currentRecord = null;

/**
 * Renders the matched meme by overlaying caption text on top of the
 * template image with absolutely-positioned divs (Imgflip's image host
 * doesn't send CORS headers, so a <canvas> approach would break exports).
 * Also renders a "Matching GIFs" panel underneath, sourced from Giphy.
 * @param {object} record
 */
export function renderMeme(record) {
  currentRecord = record;
  const container = qs("#meme-results");
  clear(container);

  renderMemeSection(container);
  renderGifSection(container);
}

// ---------------------------------------------------------------------
// Meme
// ---------------------------------------------------------------------

function renderMemeSection(container) {
  const meme = currentRecord.meme;
  if (!meme || !meme.fits) {
    container.appendChild(
      el("div", { class: "empty-state" }, [
        el("h3", {}, ["No suitable meme"]),
        el("p", {}, [meme?.reason || "Nothing in the template library genuinely fit this post's tone."]),
      ])
    );
    return;
  }

  const { template, captions, reason } = meme;

  const overlayWrap = el("div", {
    style: "position:relative; width:100%; max-width:480px; margin:0 auto; border-radius:10px; overflow:hidden;",
  });
  overlayWrap.appendChild(
    el("img", { src: template.url, alt: template.name, style: "width:100%; display:block;" })
  );

  const boxCount = Math.max(captions.length, 1);
  captions.forEach((text, i) => {
    const topPercent = boxCount === 1 ? 82 : (i / (boxCount - 1)) * 78 + 4;
    overlayWrap.appendChild(
      el(
        "div",
        {
          style: `position:absolute; left:4%; right:4%; top:${topPercent}%; text-align:center; font-family:Impact, "Arial Narrow", sans-serif; font-size:clamp(14px,5vw,28px); font-weight:700; color:#fff; text-transform:uppercase; -webkit-text-stroke:1.5px black; text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000; line-height:1.1;`,
        },
        [text]
      )
    );
  });

  const regenBtn = el("button", { class: "btn btn--ghost btn--sm", id: "meme-regen-btn" }, ["🔁 Regenerate"]);
  regenBtn.addEventListener("click", handleRegenerateMeme);

  container.appendChild(
    el("div", { class: "meme-frame" }, [
      el("div", { style: "padding:20px; display:flex; justify-content:center;" }, [overlayWrap]),
      el(
        "div",
        {
          class: "meme-frame__caption",
          style: "display:flex; justify-content:space-between; align-items:center; gap:12px;",
        },
        [el("span", {}, [`"${template.name}" — ${reason}`]), regenBtn]
      ),
    ])
  );
}

async function handleRegenerateMeme() {
  if (!currentRecord) return;
  const btn = qs("#meme-regen-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Regenerating…";
  }

  try {
    const updated = await regenerateMeme(currentRecord);
    currentRecord = updated;
    const container = qs("#meme-results");
    clear(container);
    renderMemeSection(container);
    renderGifSection(container);
    showToast("New meme generated");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Couldn't regenerate the meme", "error");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "🔁 Regenerate";
    }
  }
}

// ---------------------------------------------------------------------
// GIFs
// ---------------------------------------------------------------------

function defaultGifQuery(record) {
  const u = record.understanding || {};
  const fromUnderstanding = [u.emotion, u.topic].filter(Boolean).join(" ").trim();
  return fromUnderstanding || (record.postText || "").slice(0, 40);
}

function renderGifSection(container) {
  const panel = el("div", { class: "panel", style: "margin-top:20px;" });
  panel.appendChild(el("h3", { style: "font-size:var(--fs-md); margin-bottom:4px;" }, ["Matching GIFs"]));
  panel.appendChild(
    el("p", { style: "font-size:var(--fs-xs); color:var(--text-faint); margin-bottom:14px;" }, [
      "Pulled from Giphy based on this post's topic and tone. Tweak the search or shuffle for different results.",
    ])
  );

  if (!storage.getGiphyKey()) {
    panel.appendChild(
      el("div", { class: "empty-state" }, [
        el("h3", {}, ["No Giphy key set"]),
        el("p", {}, ["Add a free Giphy API key in Settings to pull matching GIFs for your posts."]),
      ])
    );
    container.appendChild(panel);
    return;
  }

  const query = currentRecord.gifQuery || defaultGifQuery(currentRecord);
  const input = el("input", {
    class: "text-input",
    id: "gif-query-input",
    value: query,
    style: "flex:1;",
  });
  const searchBtn = el("button", { class: "btn btn--primary btn--sm" }, ["Search"]);
  const shuffleBtn = el("button", { class: "btn btn--ghost btn--sm" }, ["🔀 Shuffle"]);

  panel.appendChild(
    el("div", { style: "display:flex; gap:10px; margin-bottom:14px;" }, [input, searchBtn, shuffleBtn])
  );

  const grid = el("div", { class: "card-grid", id: "gif-grid" });
  panel.appendChild(grid);
  container.appendChild(panel);

  searchBtn.addEventListener("click", () => runGifSearch(input.value.trim(), grid, searchBtn));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runGifSearch(input.value.trim(), grid, searchBtn);
  });
  shuffleBtn.addEventListener("click", () =>
    runGifSearch(input.value.trim() || query, grid, shuffleBtn, { shuffle: true })
  );

  if (currentRecord.gifResults?.length && currentRecord.gifQuery === query) {
    populateGifGrid(grid, currentRecord.gifResults);
  } else {
    runGifSearch(query, grid, searchBtn);
  }
}

async function runGifSearch(query, grid, triggerBtn, { shuffle = false } = {}) {
  if (!query) {
    showToast("Type something to search for", "error");
    return;
  }
  const originalLabel = triggerBtn?.textContent;
  if (triggerBtn) triggerBtn.disabled = true;
  clear(grid);
  grid.appendChild(el("div", { class: "skeleton", style: "height:120px; grid-column: 1 / -1;" }));

  try {
    // Random offset gives a genuinely different batch of equally-relevant
    // results on Shuffle, rather than the same top results every time.
    const offset = shuffle ? Math.floor(Math.random() * 40) : 0;
    const { needsKey, gifs, error } = await searchGifs(query, 8, offset);
    clear(grid);

    if (needsKey) {
      grid.appendChild(el("p", { style: "color:var(--text-faint); font-size:var(--fs-sm);" }, ["No Giphy key set."]));
      return;
    }
    if (error) {
      grid.appendChild(
        el("p", { style: "color:var(--danger); font-size:var(--fs-sm);" }, [`GIF search failed: ${error}`])
      );
      return;
    }
    if (gifs.length === 0) {
      grid.appendChild(
        el("p", { style: "color:var(--text-faint); font-size:var(--fs-sm);" }, ["No GIFs found for that search."])
      );
      return;
    }

    populateGifGrid(grid, gifs);
    currentRecord.gifQuery = query;
    currentRecord.gifResults = gifs;
    storage.updateAnalysis(currentRecord);
  } catch (err) {
    console.error(err);
    clear(grid);
    grid.appendChild(
      el("p", { style: "color:var(--danger); font-size:var(--fs-sm);" }, ["Something went wrong fetching GIFs."])
    );
  } finally {
    if (triggerBtn) {
      triggerBtn.disabled = false;
      if (originalLabel) triggerBtn.textContent = originalLabel;
    }
  }
}

function populateGifGrid(grid, gifs) {
  clear(grid);
  for (const g of gifs) {
    grid.appendChild(
      el(
        "a",
        {
          href: g.pageUrl,
          target: "_blank",
          rel: "noopener",
          style: "display:block; border-radius:10px; overflow:hidden; border:1px solid var(--ink-border-soft);",
        },
        [el("img", { src: g.previewUrl || g.url, alt: g.title || "gif", loading: "lazy", style: "width:100%; display:block;" })]
      )
    );
  }
}
