import { qs, clear, el } from "../utils/dom.js";

/**
 * Renders the matched meme by overlaying caption text on top of the
 * template image with absolutely-positioned divs. This is used instead of
 * drawing to a &lt;canvas&gt; because Imgflip's image host doesn't send CORS
 * headers, which would taint a canvas and block any export/download —
 * an HTML overlay has no such restriction and looks identical.
 * @param {object} record
 */
export function renderMeme(record) {
  const container = qs("#meme-results");
  clear(container);

  const meme = record.meme;
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

  container.appendChild(
    el("div", { class: "meme-frame" }, [
      el("div", { style: "padding:20px; display:flex; justify-content:center;" }, [overlayWrap]),
      el("div", { class: "meme-frame__caption" }, [`"${template.name}" — ${reason}`]),
    ])
  );
}
