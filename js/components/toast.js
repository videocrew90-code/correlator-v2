import { el, qs } from "../utils/dom.js";

/**
 * Shows a transient toast message in the bottom-right stack.
 * @param {string} message
 * @param {"info"|"error"} [type]
 */
export function showToast(message, type = "info") {
  const stack = qs("#toast-stack");
  if (!stack) return;

  const toast = el(
    "div",
    { class: `toast${type === "error" ? " toast--error" : ""}` },
    [message]
  );
  stack.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 200ms ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 220);
  }, 4200);
}
