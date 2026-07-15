import { qs, clear, el } from "../utils/dom.js";

let html2canvasPromise = null;
function loadHtml2Canvas() {
  if (html2canvasPromise) return html2canvasPromise;
  html2canvasPromise = new Promise((resolve, reject) => {
    if (window.html2canvas) return resolve(window.html2canvas);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload = () => resolve(window.html2canvas);
    script.onerror = () => reject(new Error("Failed to load html2canvas"));
    document.head.appendChild(script);
  });
  return html2canvasPromise;
}

// images.weserv.nl re-serves any public image with proper CORS headers,
// which lets us capture the overlay to canvas without tainting it —
// Imgflip's own host doesn't send those headers (see comment below).
function corsSafeUrl(url) {
  const stripped = url.replace(/^https?:\/\//, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}`;
}

/**
 * Renders the matched meme by overlaying caption text on top of the
 * template image with absolutely-positioned divs. This is used instead of
 * drawing to a <canvas> because Imgflip's image host doesn't send CORS
 * headers, which would taint a canvas and block any export/download —
 * an HTML overlay has no such restriction and looks identical.
 * A CORS-safe mirror of the image is used so the Download button can still
 * flatten everything to a canvas on demand via html2canvas.
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
  const img = el("img", {
    src: corsSafeUrl(template.url),
    crossorigin: "anonymous",
    alt: template.name,
    style: "width:100%; display:block;",
  });
  overlayWrap.appendChild(img);
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

  const downloadBtn = el(
    "button",
    { class: "meme-frame__download", style: "margin:0 auto; display:block; padding:8px 16px; cursor:pointer;" },
    ["Download meme"]
  );
  downloadBtn.addEventListener("click", async () => {
    downloadBtn.disabled = true;
    downloadBtn.textContent = "Preparing…";
    try {
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(overlayWrap, { useCORS: true, backgroundColor: null });
      const link = document.createElement("a");
      link.download = `${template.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-meme.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Meme download failed:", err);
      downloadBtn.textContent = "Download failed — try again";
      downloadBtn.disabled = false;
      return;
    }
    downloadBtn.textContent = "Download meme";
    downloadBtn.disabled = false;
  });

  container.appendChild(
    el("div", { class: "meme-frame" }, [
      el("div", { style: "padding:20px; display:flex; justify-content:center;" }, [overlayWrap]),
      el("div", { class: "meme-frame__caption" }, [`"${template.name}" — ${reason}`]),
      downloadBtn,
    ])
  );
}
