/**
 * Tiny DOM helpers to avoid repeating querySelector boilerplate everywhere.
 */

/** @param {string} sel @param {ParentNode} [root] */
export function qs(sel, root = document) {
  return root.querySelector(sel);
}

/** @param {string} sel @param {ParentNode} [root] */
export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

/**
 * Create an element with attributes and children in one call.
 * @param {string} tag
 * @param {Object} [attrs]
 * @param {(Node|string)[]} [children]
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (key === "class") node.className = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value !== undefined && value !== null) {
      node.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

/** Escape text for safe insertion into innerHTML strings. */
export function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Remove all children from a node. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
